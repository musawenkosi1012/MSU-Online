
import asyncio
import json
import re
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.features.research.scraper import AdvancedScraper

class ResearchService:
    def __init__(self):
        # Instantiate scraper directly (model_service optional for search)
        self.scraper = AdvancedScraper(None)

    async def _run_llm(self, prompt: str, max_tokens: int) -> str:
        """Run blocking LLM generation in a separate thread."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, 
            lambda: self.llm.generate_response(prompt, max_tokens=max_tokens)
        )

    async def generate_deep_essay(self, user_id: str, query: str, style: str = "academic", db: Session = None) -> Dict:
        """
        Generates a comprehensive 5000+ word essay on the given query.
        Persists results to database if session is provided.
        """
        # Lazy import to avoid circular dependencies
        from app.shared.model_service import model_service
        from app.shared.audit import audit_service
        from app.core.database import ResearchResult, GeneratedContent
        
        self.llm = model_service
        
        print(f"[ResearchService] Starting Deep Essay for: {query}")
        
        # 1. Gather Initial Context (Deep Search)
        try:
            search_results = await self.scraper.search(query, max_results=8)
            
            # Persist search results
            if db:
                try:
                    new_research = ResearchResult(
                        user_id=int(user_id),
                        query=query,
                        results_json=json.dumps([r.dict() if hasattr(r, 'dict') else r for r in search_results])
                    )
                    db.add(new_research)
                    db.commit()
                except Exception as db_err:
                    print(f"[ResearchService] DB Save Error: {db_err}")
                
        except Exception as e:
            print(f"[ResearchService] Search error: {e}")
            # Continue even if search fails, using what we have or generic knowledge
            search_results = []
        
        # Combine content for context
        context_text = ""
        sources = []
        for res in search_results:
            if res.get('content_clean'):
                context_text += f"\nSource: {res['title']} ({res['url']})\n{res['content_clean'][:2000]}\n"
                sources.append({"title": res['title'], "url": res['url']})
        
        if not context_text:
            context_text = "No specific external research found. Rely on general academic knowledge."

        # 2. Generate Comprehensive Outline
        outline_prompt = f"""
        You are an elite academic researcher. Create a comprehensive outline for a deep dive essay on: "{query}".
        Style: {style}
        
        Research Context:
        {context_text[:10000]}
        
        The outline must have:
        - 1 Introduction
        - 6-8 Detailed Body Sections (covering history, technical details, challenges, future, etc.)
        - 1 Conclusion
        
        Return JSON format:
        {{
            "title": "Essay Title",
            "sections": [
                {{"heading": "1. Introduction", "instruction": "Cover background and thesis"}},
                ...
            ]
        }}
        """
        
        outline_resp = await self._run_llm(outline_prompt, max_tokens=1500)
        
        outline_data = {
            "title": f"Deep Dive: {query}",
            "sections": [
                {"heading": "1. Introduction", "instruction": "Introduction to the topic"},
                {"heading": "2. Core Concepts", "instruction": "Explain the basics"},
                {"heading": "3. Advanced Analysis", "instruction": "Deep dive into details"},
                {"heading": "4. Conclusion", "instruction": "Wrap up"}
            ]
        }

        try:
            json_match = re.search(r'\{.*\}', outline_resp, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                if "sections" in parsed:
                    outline_data = parsed
        except Exception as e:
            print(f"[ResearchService] Outline parse error: {e}")

        # 3. Generate Content per Section
        essay_title = outline_data.get('title', query)
        full_essay = f"# {essay_title}\n\n"
        total_words = 0
        
        for section in outline_data.get('sections', []):
            heading = section.get('heading', 'Section')
            instruction = section.get('instruction', 'Write about this topic')
            
            print(f"[ResearchService] Generating section: {heading}")
            
            section_prompt = f"""
            Write a detailed, academic section for an essay on "{query}".
            
            Section: {heading}
            Goal: {instruction}
            Target Length: 400-600 words.
            Style: {style}
            
            Use the provided verified research context where applicable.
            Do not include the section heading in your output, just the body text.
            
            Context:
            {context_text[:15000]}
            """
            
            section_content = await self._run_llm(section_prompt, max_tokens=1500)
            
            full_essay += f"## {heading}\n\n{section_content.strip()}\n\n"
            total_words += len(section_content.split())
            
        # 4. Append Sources
        if sources:
            full_essay += "## References\n\n"
            for s in sources:
                full_essay += f"- [{s.get('title', 'Source')}]({s.get('url', '#')})\n"
            
        result = {
            "query": query,
            "word_count": total_words,
            "content": full_essay,
            "sources": sources
        }
        
        # Log to audit & Database
        try:
            audit_service.log_web_scrape(user_id, query, [s['url'] for s in sources], True)
            
            if db:
                new_content = GeneratedContent(
                    user_id=int(user_id),
                    type="essay",
                    title=essay_title,
                    content=full_essay,
                    metadata_json=json.dumps({
                        "query": query,
                        "style": style,
                        "word_count": total_words,
                        "sources": sources
                    })
                )
                db.add(new_content)
                db.commit()
                result["saved"] = True
                result["content_id"] = new_content.id
        except Exception as e:
            print(f"[ResearchService] Error saving content: {e}")
        
        return result

# Singleton instance
research_service = ResearchService()

