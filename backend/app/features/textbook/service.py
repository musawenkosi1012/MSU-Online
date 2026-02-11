import json
import datetime
from app.core.database import Course, Module, CourseMaterial, GeneratedContent, SessionLocal, get_db
from sqlalchemy.orm import Session
from app.shared.model_service import model_service
from app.features.courses.service import course_service
from app.shared.schemas import TopicIdentifier

class TextbookService:
    def __init__(self):
        pass

    def get_textbook(self, course_id, db: Session = None):
        """Fetch the generated textbook from DB."""
        _db = db or SessionLocal()
        try:
            c_id = int(course_id) if isinstance(course_id, str) and course_id.isdigit() else course_id
            textbook = _db.query(GeneratedContent).filter(GeneratedContent.course_id == c_id, GeneratedContent.type == 'textbook').first()
            if textbook:
                return json.loads(textbook.content)
            return None
        except Exception as e:
            print(f"Error fetching textbook: {e}")
            return None
        finally:
            if db is None:
                _db.close()

    async def generate_textbook(self, course_id, force_regenerate=False, db: Session = None, user_id: int = None):
        """Synthesize materials into a structured textbook (Recursive RAG)."""
        print(f"[Textbook] Generating textbook for course: {course_id}")
        _db = db or SessionLocal()
        
        try:
            c_id = int(course_id) if isinstance(course_id, str) and course_id.isdigit() else None
            
            # 1. Load or Initialize Structure
            existing = _db.query(GeneratedContent).filter(GeneratedContent.course_id == c_id, GeneratedContent.type == 'textbook').first()
            if existing and not force_regenerate:
                textbook_content = json.loads(existing.content)
                print("[Textbook] Loaded existing structure. Resuming generation...")
            else:
                # Initialize Skeleton from Course
                course = course_service.get_course_by_id(course_id, db=_db)
                if not course:
                    return {"status": "error", "message": "Course not found"}
                
                textbook_content = {
                    "title": course['title'],
                    "description": course['description'],
                    "is_programming": course.get('is_programming', False),
                    "chapters": []
                }
                
                # If course has modules already (from the new Tutor Dashboard Outline Designer)
                if course.get('modules'):
                    for i, module in enumerate(course['modules']):
                        textbook_content["chapters"].append({
                            "chapter_id": module['id'],
                            "title": module['title'],
                            "intro": module.get('description', ''),
                            "sections": [{"title": st['title'], "content": st.get('content', ""), "practice_code": st.get('practice_code', ""), "order": j} for j, st in enumerate(module.get('sub_topics', []))],
                            "summary": "",
                            "order": i
                        })
                else:
                    # Fallback for legacy courses
                    for i, module in enumerate(course.get('modules', [])):
                        textbook_content["chapters"].append({
                            "chapter_id": module['id'],
                            "title": module['title'],
                            "intro": "",
                            "sections": [{"title": l['title'], "content": "", "order": j} for j, l in enumerate(module.get('lessons', []))],
                            "summary": "",
                            "order": i
                        })

            # 2. Recursive Generation Loop
            from app.core.rag.retriever import retriever
            
            total_chapters = len(textbook_content["chapters"])
            
            for i, chapter in enumerate(textbook_content["chapters"]):
                print(f"[Textbook] Processing Chapter {i+1}/{total_chapters}: {chapter['title']}")
                
                # Generate Intro if missing
                if not chapter.get("intro") or force_regenerate:
                    intro_prompt = f"Write an engaging introduction for the chapter '{chapter['title']}' in the course '{textbook_content['title']}'."
                    chapter["intro"] = model_service.generate_response(intro_prompt)

                # Generate Section Content
                for section in chapter["sections"]:
                    if section.get("content") and len(section["content"]) > 100 and not force_regenerate:
                        continue # Skip existing

                    print(f"  - Generating Section: {section['title']}")
                    
                    # RAG Context Retrieval
                    query = f"{chapter['title']}: {section['title']}"
                    context = retriever.retrieve_context(query, str(course_id), max_tokens=1500)
                    
                    # DeepSeek Prompt for Detailed Content
                    prompt = f"""You are the author of a comprehensive university-level textbook.
Course: {textbook_content['title']}
Chapter: {chapter['title']}
Section: {section['title']}

Context:
{context}

Task: Write a detailed, educational textbook section (approx 800-1200 words).
Structure:
1. Start with clear Learning Objectives.
2. Provide deep, explanatory content with examples.
3. Use formatted Markdown (headings, bold terms, lists).
4. Include a 'Key Terms' list at the end.
5. Tone: Academic, encouraging, and authoritative.

Write ONLY the content in Markdown format.
"""
                    content = model_service.generate_response(prompt, max_tokens=3000)
                    section["content"] = content
                    
                    # Save progress after each section (to handle timeouts/failures)
                    self._save_to_db(_db, c_id, textbook_content, user_id)

                # Generate Summary if missing
                if not chapter.get("summary") or force_regenerate:
                    summary_prompt = f"Summarize the key points of the chapter '{chapter['title']}' based on its sections."
                    chapter["summary"] = model_service.generate_response(summary_prompt)
                    self._save_to_db(_db, c_id, textbook_content, user_id)

            return textbook_content

        except Exception as e:
            print(f"Error generating textbook: {e}")
            return {"status": "error", "message": f"Synthesis failed: {str(e)}"}
        finally:
            if db is None:
                _db.close()

    def _save_to_db(self, db, course_id, content, user_id=None):
        try:
             content_str = json.dumps(content)
             existing = db.query(GeneratedContent).filter(GeneratedContent.course_id == course_id, GeneratedContent.type == 'textbook').first()
             if existing:
                 existing.content = content_str
                 existing.updated_at = datetime.datetime.utcnow()
                 # If user_id is provided, maybe update owner? Or leave as original creator.
             else:
                 new_textbook = GeneratedContent(
                     course_id=course_id,
                     content=content_str,
                     type='textbook',
                     title=content.get('title', 'Generated Textbook'),
                     user_id=user_id
                 )
                 db.add(new_textbook)
             db.commit()
        except Exception as e:
            print(f"Error saving DB checkoint: {e}")
            db.rollback()

    def chat_context(self, course_id, chapter_id, section_title, user_query):
        """Context-aware chat with Musa about specific textbook section."""
        textbook = self.get_textbook(course_id)
        if not textbook:
            return model_service.generate_response(user_query)

        # Find the specific section content
        context_text = ""
        for chapter in textbook.get('chapters', []):
            if chapter.get('chapter_id') == chapter_id:
                for section in chapter.get('sections', []):
                    if section.get('title') == section_title:
                        context_text = section.get('content', "")
                        break
        
        prompt = f"""You are Musa, the EduNexus AI Tutor. 
You are helping a student who is currently reading the following section of their Electronic Textbook:
Context: {context_text[:3000]}

Student: {user_query}

Provide a deep, insightful, and supportive response based on the textbook content. Track their progress and encourage further inquiry."""
        
        return model_service.generate_response(prompt)

    def generate_quiz(self, section_content: str):
        """Generate a 3-question MCQ quiz for a section."""
        prompt = f"""Generate a mini-quiz to test comprehension of the following text:
Text: {section_content[:2000]}

Requirements:
1. Create 3 multiple-choice questions.
2. Each question should have 4 options.
3. Indicate the correct answer.
4. Return ONLY JSON in this format:
[
  {{
    "question": "Question text...",
    "options": ["A", "B", "C", "D"],
    "correct_index": 0
  }}
]
"""
        return self._generate_json(prompt, default=[])

    async def generate_chapter_assessment(self, course_id: str, chapter_index: int, chapter_title: str, chapter_content: str, user_id: str = "guest"):
        """
        Generate comprehensive chapter assessment.
        - 10 MCQs (5 marks each)
        - 2 Open-Ended (5 marks each)
        - Total 60 Marks
        """
        prompt = f"""Create a comprehensive assessment for the chapter '{chapter_title}'.
        
Content Context:
{chapter_content[:15000]}

Requirements:
1. **10 Multiple Choice Questions (MCQs)**:
   - Test key concepts, definitions, and application.
   - 4 plausible options per question.
   - One correct answer.
   - Explanation for the correct answer.

2. **2 Open-Ended Questions**:
   - Focus on critical thinking, synthesis, or application.
   - Provide a 'grading_rubric' (key points required for full marks).

Output Format (Strict JSON):
{{
  "title": "Assessment: {chapter_title}",
  "mcqs": [
    {{
      "question": "...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "..."
    }}
  ],
  "open_ended": [
    {{
      "question": "...",
      "rubric": "Key points to mention: ..."
    }}
  ]
}}
"""
        # Run in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        full_assessment = await loop.run_in_executor(
            None, 
            lambda: self._generate_json(prompt, default={"mcqs": [], "open_ended": []})
        )
        
        # Add Metadata
        assessment_id = f"{course_id}-chapter-{chapter_index}"
        full_assessment["id"] = assessment_id
        full_assessment["course_id"] = course_id
        full_assessment["chapter_index"] = chapter_index
        full_assessment["source"] = "chapter_exercise"
        full_assessment["type"] = "mixed" # Internal type
        full_assessment["topic_id"] = TopicIdentifier(
            course_id=str(course_id),
            chapter_index=chapter_index,
            section_index=0 # Chapter assessment
        ).string_id

        # Register with Assessment Service
        from app.features.assessment.service import assessment_service
        assessment_service.register_assessment(full_assessment)
        
        # Sanitize for Frontend (Remove answers)
        sanitized = {
            "id": assessment_id,
            "title": full_assessment.get("title", f"Assessment: {chapter_title}"),
            "mcqs": [],
            "open_ended": []
        }
        
        for q in full_assessment.get("mcqs", []):
            sanitized["mcqs"].append({
                "question": q["question"],
                "options": q["options"]
            })
            
        for q in full_assessment.get("open_ended", []):
            sanitized["open_ended"].append({
                "question": q["question"]
            })
            
        return sanitized

    def generate_final_exam(self, course_id: str, title: str, textbook_content: Dict[str, Any]):
        """
        Generate a comprehensive final exam for the course.
        """
        # 1. Aggregate Content Summary (Limit size for context window)
        # We'll take chapter summaries and titles.
        context_text = f"Course: {title}\n\n"
        for i, chap in enumerate(textbook_content.get("chapters", [])):
            context_text += f"Chapter {i+1}: {chap.get('title')}\n"
            context_text += f"Summary: {chap.get('summary')}\n\n"
            
        prompt = f"""
        You are an expert academic examiner. Create a comprehensive Final Exam for the course "{title}".
        Use the following chapter summaries to ensure coverage of the entire curriculum:
        
        {context_text}
        
        Generate a JSON object with:
        1. "title": "Final Exam: {title}"
        2. "mcqs": A list of 20 Multiple Choice Questions. Each with "question", "options" (List[str]), "correct_index" (integer 0-3), "explanation".
        3. "open_ended": A list of 4 Open-Ended Questions. Each with "question", "rubric" (guide for grading).
        
        The questions should be challenging and test deep understanding, synthesis, and application of concepts.
        """
        
        # 2. Call LLM
        full_assessment = self._generate_json(prompt, default={"mcqs": [], "open_ended": []})
        
        # 3. Add Metadata
        assessment_id = f"{course_id}-final-exam"
        full_assessment["id"] = assessment_id
        full_assessment["course_id"] = course_id
        full_assessment["source"] = "final_exam"
        full_assessment["type"] = "comprehensive"
        full_assessment["topic_id"] = TopicIdentifier(
            course_id=str(course_id),
            chapter_index=999, # Final
            section_index=999
        ).string_id

        # 4. Register with Assessment Service
        from app.features.assessment.service import assessment_service
        assessment_service.register_assessment(full_assessment)
        
        # 5. Sanitize for Frontend
        sanitized = {
            "id": assessment_id,
            "title": full_assessment.get("title", f"Final Exam: {title}"),
            "mcqs": [],
            "open_ended": []
        }
        
        for q in full_assessment.get("mcqs", []):
            sanitized["mcqs"].append({
                "question": q["question"],
                "options": q["options"]
            })
            
        for q in full_assessment.get("open_ended", []):
            sanitized["open_ended"].append({
                "question": q["question"]
            })
            
        return sanitized

    def _generate_json(self, prompt, default=None):
        """Helper to generate and parse JSON from AI."""
        try:
            response = model_service.generate_response(prompt, max_tokens=2000)
            clean_json = response.strip()
            if "```json" in clean_json:
                clean_json = clean_json.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_json:
                 clean_json = clean_json.split("```")[1].split("```")[0].strip()
            elif "[" in clean_json and clean_json.startswith("["): # Array
                pass 
            elif "{" in clean_json: # Object
                clean_json = "{" + clean_json.split("{", 1)[1].rsplit("}", 1)[0] + "}"
            
            return json.loads(clean_json)
        except Exception as e:
            print(f"Error generating JSON: {e}")
            return default

    def get_chapter(self, course_id, chapter_id, db: Session = None):
        """Fetch a specific chapter from the textbook."""
        textbook = self.get_textbook(course_id, db=db)
        if not textbook:
            return None
        
        for chapter in textbook.get('chapters', []):
            if str(chapter.get('chapter_id')) == str(chapter_id):
                return chapter
        return None

    async def update_structure(self, course_id: str, new_structure: dict, db: Session = None):
        """Update the textbook structure (Tutor Editor)."""
        _db = db or SessionLocal()
        try:
            c_id = int(course_id) if isinstance(course_id, str) and course_id.isdigit() else course_id
            existing = _db.query(GeneratedContent).filter(GeneratedContent.course_id == c_id, GeneratedContent.type == 'textbook').first()
            
            if existing:
                # Merge new structure with existing content to preserve generated text if only reordering
                current_data = json.loads(existing.content)
                current_data['chapters'] = new_structure.get('chapters', [])
                current_data['last_updated'] = str(datetime.datetime.utcnow())
                
                existing.content = json.dumps(current_data)
                existing.updated_at = datetime.datetime.utcnow()
                _db.commit()
                return current_data
            else:
                return None
        except Exception as e:
            print(f"Error updating textbook structure: {e}")
            _db.rollback()
            return None
        finally:
            if db is None:
                _db.close()

textbook_service = TextbookService()
