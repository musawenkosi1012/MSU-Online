"""
Model Service (Enhanced)
LLM wrapper with structured prompts, RAG integration, and reasoning loops.
"""
import json
import os
import re
import time
from typing import Dict, Any, List, Optional
from threading import Lock

from app.core.rag.retriever import retriever

# ============================================
# STRUCTURED SYSTEM PROMPTS
# ============================================

SYSTEM_PROMPT = """You are Musa, the EduNexus AI Tutor.

CORE RULES:
- Be helpful, encouraging, and accurate.
- Answer directly without preambles.
- No reasoning or wrapper markers (<thought>, <response>, <speak>, etc.).
- NEVER repeat your own previous answers or sentences within the same response.
- Use provided context where relevant.
"""

CHAT_PROMPT_TEMPLATE = """{system_prompt}

[KNOWLEDGE CONTEXT]
{context}

[STUDENT PROFILE]
Topics: {topics_covered} | Mastery: {mastery_level} | Style: {learning_style}

[SESSION HISTORY]
{conversation_history}

[CURRENT STUDENT QUERY]
{user_input}

[MUSA RESPONSE]
"""

INTERACTIVE_PROMPT_TEMPLATE = """{system_prompt}

[TUTOR STATE: {tutor_state}]
[TOPIC: {topic_title}]

[KNOWLEDGE CONTEXT]
{context}

[STUDENT PROFILE]
Mastery: {mastery}% | Hints: {hints_used}
Learning Style: {learning_style}
Common Mistakes: {common_mistakes}

[CURRENT STUDENT INPUT]
{user_input}

[PEDAGOGICAL INSTRUCTIONS]
{state_instructions}

[MUSA RESPONSE]
"""

STATE_INSTRUCTIONS = {
    "INTRODUCE": "Provide a warm introduction to this topic. Explain what they will learn and why it matters.",
    "EXPLAIN": "Explain the concept clearly. Use analogies and examples. Break down complex ideas step by step.",
    "CHECK_UNDERSTANDING": "Ask a probing question to assess comprehension. Don't give away the answer.",
    "ASSESS": "Present an exercise or question to evaluate understanding. This affects their grade.",
    "UPDATE_MASTERY": "Provide encouraging feedback about their progress based on their performance.",
    "ADVANCE": "Congratulate them and prepare to introduce the next concept.",
    "REMEDIATE": "Provide additional examples and simpler explanations. Be patient and supportive."
}

# API Provider clients are handled on demand or via environment detection

class ModelService:
    def __init__(self):
        self.llm = None
        self.openai_client = None
        self.openai_model = "gpt-4o"
        self.gemini_model = None
        self.anthropic_client = None
        self.is_loading = False
        self.lock = Lock()
        print("Model service initialized (API-Only Mode).")

    def load_model(self):
        """Initialize appropriate API client based on environment variables."""
        with self.lock:
            if self.llm:
                return True
                
            if self.is_loading:
                return False
    
            self.is_loading = True
        try:
            # Check for Mock Mode
            if os.environ.get("USE_MOCK_LLM", "false").lower() == "true":
                print("[SYSTEM] Running in MOCK AI Mode")
                self.llm = "MOCK"
                self.is_loading = False
                return True

            # 1. DeepSeek API (OpenAI Compatible)
            deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
            if deepseek_key:
                try:
                    from openai import OpenAI
                    self.openai_client = OpenAI(api_key=deepseek_key, base_url="https://api.deepseek.com")
                    self.openai_model = "deepseek-chat"
                    self.llm = "OPENAI"
                    print(f"[SYSTEM] Connected to DeepSeek API")
                    self.is_loading = False
                    return True
                except Exception as e:
                    print(f"[ERROR] Failed to initialize DeepSeek client: {e}")

            # 2. Google Gemini API
            gemini_key = os.environ.get("GEMINI_API_KEY")
            if gemini_key:
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=gemini_key)
                    self.gemini_model = genai.GenerativeModel('gemini-pro')
                    self.llm = "GEMINI"
                    print(f"[SYSTEM] Connected to Google Gemini API")
                    self.is_loading = False
                    return True
                except Exception as e:
                    print(f"[ERROR] Failed to initialize Gemini client: {e}")

            # 3. Anthropic (Claude) API
            anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
            if anthropic_key:
                try:
                    import anthropic
                    self.anthropic_client = anthropic.Anthropic(api_key=anthropic_key)
                    self.anthropic_model = "claude-3-opus-20240229"
                    self.llm = "ANTHROPIC"
                    print(f"[SYSTEM] Connected to Anthropic Claude API")
                    self.is_loading = False
                    return True
                except Exception as e:
                    print(f"[ERROR] Failed to initialize Anthropic client: {e}")

            # 4. Standard/Generic OpenAI API
            openai_key = os.environ.get("OPENAI_API_KEY")
            if openai_key:
                try:
                    from openai import OpenAI
                    base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
                    self.openai_client = OpenAI(api_key=openai_key, base_url=base_url)
                    self.openai_model = os.environ.get("OPENAI_MODEL", "gpt-4o")
                    self.llm = "OPENAI"
                    print(f"[SYSTEM] Connected to OpenAI API (Model: {self.openai_model})")
                    self.is_loading = False
                    return True
                except Exception as e:
                    print(f"[ERROR] Failed to initialize OpenAI client: {e}")

            # If no API key found, default to MOCK to prevent crash
            print("[WARNING] No API keys found. Switching to MOCK mode.")
            self.llm = "MOCK"
            self.is_loading = False
            return True
        except Exception as e:
            print(f"Error initializing AI service: {e}")
            self.llm = None
            self.is_loading = False
            return False

    def unload_model(self):
        """No-op for API-only mode."""
        self.llm = None
        return True

    # ============================================
    # RAG-ENHANCED GENERATION
    # ============================================

    def generate_with_rag(self, query: str, course_id: str = None,
                          user_memory: Dict[str, Any] = None,
                          conversation_history: str = "",
                          max_tokens: int = 500) -> Dict[str, Any]:
        """
        Generate response with RAG context injection.
        """
        # Retrieve minimal relevant context for speed
        context = retriever.retrieve_context(query, course_id, max_tokens=500)
        retrieved_chunks = retriever.retrieve(query, course_id)
        
        # Build user memory string
        memory = user_memory or {}
        topics_str = ", ".join(memory.get("topics_covered", [])[:5]) or "None yet"
        mastery_str = f"{memory.get('overall_mastery', 0) * 100:.0f}%"
        learning_style = memory.get("learning_style", "balanced")
        
        # Build prompt
        prompt = CHAT_PROMPT_TEMPLATE.format(
            system_prompt=SYSTEM_PROMPT,
            context=context or "[No retrieved context available]",
            topics_covered=topics_str,
            mastery_level=mastery_str,
            learning_style=learning_style,
            conversation_history=conversation_history or "[No prior conversation]",
            user_input=query
        )
        
        # Generate response
        response = self._generate(prompt, max_tokens)
        
        # Calculate confidence based on retrieval
        confidence = self._calculate_confidence(retrieved_chunks, response)
        
        return {
            "response": response,
            "retrieved_context": [c["text"][:200] + "..." for c in retrieved_chunks[:3]],
            "sources": [c.get("metadata", {}).get("topic_title", "Unknown") for c in retrieved_chunks[:3]],
            "confidence": confidence,
            "rag_enabled": True
        }

    def generate_interactive(self, query: str, tutor_state: str,
                             course_data: Dict[str, Any] = None,
                             user_memory: Dict[str, Any] = None,
                             mastery: float = 0.0, hints_used: int = 0,
                             max_tokens: int = 400) -> Dict[str, Any]:
        """
        Generate response for interactive tutoring mode.
        """
        course_data = course_data or {}
        course_id = course_data.get("course_id")
        
        # Retrieve context
        context = retriever.retrieve_context(query, course_id, max_tokens=600)
        
        # Build user memory context
        memory = user_memory or {}
        mistakes_str = ", ".join(memory.get("common_mistakes", [])) or "No persistent patterns detected."
        style = memory.get("learning_style", "balanced")

        # Build prompt
        prompt = INTERACTIVE_PROMPT_TEMPLATE.format(
            system_prompt=SYSTEM_PROMPT,
            tutor_state=tutor_state,
            context=context or "[No retrieved context]",
            course_title=course_data.get("course_title", "Unknown Course"),
            topic_title=course_data.get("topic_title", "Unknown Topic"),
            mastery=int(mastery * 100),
            hints_used=hints_used,
            learning_style=style,
            common_mistakes=mistakes_str,
            user_input=query,
            state_instructions=STATE_INSTRUCTIONS.get(tutor_state, "Respond helpfully.")
        )
        
        response = self._generate(prompt, max_tokens)
        
        return {
            "response": response,
            "tutor_state": tutor_state,
            "rag_enabled": True
        }

    # ============================================
    # TWO-PASS REASONING LOOP
    # ============================================

    def generate_with_reasoning(self, query: str, course_id: str = None,
                                 max_tokens: int = 500) -> Dict[str, Any]:
        """
        Two-pass generation with validation.
        """
        # Pass 1: Generate answer
        context = retriever.retrieve_context(query, course_id, max_tokens=1500)
        
        first_prompt = f"""{SYSTEM_PROMPT}

[CONTEXT]
{context}

[QUESTION]
{query}

Think step by step and provide a clear, accurate answer:"""
        
        first_answer = self._generate(first_prompt, max_tokens)
        
        # Pass 2: Validate and refine
        validation_prompt = f"""Review this answer for accuracy and completeness:

Question: {query}
Answer: {first_answer}

Context available: {context[:500] if context else "None"}

Validation checklist:
1. Does the answer reference the provided context?
2. Are all claims supported by the material?
3. Is anything fabricated or assumed?
4. Is the explanation clear and complete?

If issues found, provide a corrected answer. If accurate, confirm:"""
        
        validation = self._generate(validation_prompt, max_tokens=300)
        
        # Determine if refinement was needed
        needs_refinement = any(word in validation.lower() for word in 
            ["incorrect", "missing", "fabricated", "inaccurate", "should be"])
        
        final_response = validation if needs_refinement else first_answer
        
        return {
            "response": final_response,
            "first_pass": first_answer,
            "validation": validation,
            "refined": needs_refinement,
            "confidence": 0.9 if not needs_refinement else 0.7
        }

    # ============================================
    # CORE GENERATION
    # ============================================

    def generate_response(self, prompt: str, max_tokens: int = 500) -> str:
        """Public wrapper for content generation."""
        return self._generate(prompt, max_tokens)

    def _generate(self, prompt: str, max_tokens: int = 500) -> str:
        """Internal generation method using APIs."""
        if not self.llm:
            success = self.load_model()
            if not success:
                return "I'm having trouble loading my AI brain. Please try again."

        # 1. OpenAI / DeepSeek / Generic API
        if self.llm == "OPENAI":
            try:
                response = self.openai_client.chat.completions.create(
                    model=self.openai_model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=max_tokens,
                    temperature=0.3
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"[AI] OpenAI Error: {e}")
                return "I'm having trouble connecting to the AI cloud."

        # 2. Google Gemini
        if self.llm == "GEMINI":
            try:
                full_prompt = f"{SYSTEM_PROMPT}\n\nUser Question: {prompt}"
                response = self.gemini_model.generate_content(
                    full_prompt,
                    generation_config={"max_output_tokens": max_tokens, "temperature": 0.3}
                )
                return response.text.strip()
            except Exception as e:
                print(f"[AI] Gemini Error: {e}")
                return "I'm having trouble connecting to Google Gemini."

        # 3. Anthropic Claude
        if self.llm == "ANTHROPIC":
            try:
                message = self.anthropic_client.messages.create(
                    model=self.anthropic_model,
                    max_tokens=max_tokens,
                    temperature=0.3,
                    system=SYSTEM_PROMPT,
                    messages=[{"role": "user", "content": prompt}]
                )
                return message.content[0].text.strip()
            except Exception as e:
                print(f"[AI] Claude Error: {e}")
                return "I'm having trouble connecting to Anthropic Claude."

        # 4. Remote Engine
        remote_url = os.environ.get("MUSA_API_URL")
        if remote_url and remote_url.startswith("http"):
            try:
                import requests
                response = requests.post(f"{remote_url}/generate", json={
                    "prompt": prompt, "max_tokens": max_tokens, "temperature": 0.3
                }, timeout=30)
                if response.status_code == 200:
                    return response.json().get("text", "").strip()
            except:
                pass

        # Fallback to Mock
        return f"This is a simulated response (API not configured). Request: {prompt[:30]}..."

    def _calculate_confidence(self, retrieved_chunks: List[Dict], response: str) -> float:
        if not retrieved_chunks: return 0.3
        avg_score = sum(c.get("score", 0) for c in retrieved_chunks) / len(retrieved_chunks)
        return round(min(0.95, 0.5 + (avg_score * 0.45)), 2)

    def grade_essay(self, question: str, answer: str, reference: str = "", 
                    topic_id: str = None) -> Dict[str, Any]:
        if not self.llm: self.load_model()
        context = reference or (retriever.retrieve_context(question, max_tokens=1000) if topic_id else "")
        prompt = f"Grade this student response based on reference material.\nQuestion: {question}\nReference: {context}\nAnswer: {answer}\nReturn JSON: {{'rubric': {{'correctness': 0-100, 'reasoning': 0-100, 'completeness': 0-100, 'clarity': 0-100}}, 'feedback': '...'}}"
        try:
            raw = self._generate(prompt, max_tokens=512)
            clean = raw[raw.find('{'):raw.rfind('}')+1]
            data = json.loads(clean)
            r = data["rubric"]
            data["score"] = round((r["correctness"] * 0.4 + r["reasoning"] * 0.3 + r["completeness"] * 0.2 + r["clarity"] * 0.1), 2)
            return data
        except:
            return {"score": 70, "rubric": {"correctness": 70, "reasoning": 70, "completeness": 70, "clarity": 70}, "feedback": "Evaluation processed with baseline scores."}

    # Other assessment methods follow the same pattern...
    def generate_assessment_content(self, topic: str, difficulty: str = "Medium", assessment_type: str = "quiz") -> Any:
        if not self.llm: self.load_model()
        prompt = f"Create a {difficulty} level {assessment_type} for: {topic}. Return JSON format."
        try:
            raw = self._generate(prompt, max_tokens=1024)
            return json.loads(raw[raw.find('['):raw.rfind(']')+1])
        except: return []

    def generate_coding_task(self, topic: str) -> Any:
        if not self.llm: self.load_model()
        prompt = f"Create a coding task for: {topic}. Return JSON."
        try:
            raw = self._generate(prompt, max_tokens=512)
            return json.loads(raw[raw.find('{'):raw.rfind('}')+1])
        except: return {"question": f"Write code for {topic}"}

    def grade_code(self, prompt: str, code: str) -> Any:
        if not self.llm: self.load_model()
        p = f"Grade this code: {code}\nTask: {prompt}\nJSON: {{'score': 0-100, 'feedback': '...'}}"
        try:
            raw = self._generate(p, max_tokens=256)
            return json.loads(raw[raw.find('{'):raw.rfind('}')+1])
        except: return {"score": 50, "feedback": "Auto-graded."}

model_service = ModelService()
