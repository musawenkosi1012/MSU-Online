import json
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, GeneratedContent
from app.shared.model_service import model_service
from .models import LessonDefinition, LessonSpec, LessonConstraints, Language, GradingResult

class LessonService:
    def __init__(self):
        pass

    def get_lesson(self, lesson_id: str, db: Session = None) -> LessonDefinition:
        """Fetch lesson from DB or generate if missing."""
        _db = db or SessionLocal()
        try:
            # Check DB
            content = _db.query(GeneratedContent).filter(
                GeneratedContent.type == 'coding_lesson',
                GeneratedContent.title == lesson_id  # Using title as ID for simplicity in this scalable model
            ).first()

            if content:
                data = json.loads(content.content)
                return LessonDefinition(**data)
            
            # Not found -> Generate
            return self.generate_lesson(lesson_id, _db)
        finally:
            if db is None:
                _db.close()

    def list_lessons(self, db: Session = None) -> list:
        """List all available lessons."""
        _db = db or SessionLocal()
        try:
            contents = _db.query(GeneratedContent).filter(GeneratedContent.type == 'coding_lesson').all()
            return [{"id": c.title, "title": json.loads(c.content).get("title", c.title)} for c in contents]
        finally:
            if db is None:
                _db.close()

    def generate_lesson(self, topic: str, db: Session) -> LessonDefinition:
        """Generate a new coding lesson using AI."""
        print(f"[CodingService] Generating lesson for topic: {topic}")
        
        prompt = f"""
        Create a beginner-friendly coding lesson in Python on the topic: '{topic}'.
        
        Provide:
        1. A title
        2. Notes explaining the concept (Markdown)
        3. A coding task as a function with signature
        4. At least 3 test cases (input/expected)
        5. Constraints (required keywords or forbidden functions)
        
        Return JSON with keys: 
        - id (slug string)
        - title
        - language (python)
        - notes
        - spec: {{ function_name, parameters (list), return_type, test_cases: [{{input: [], expected: ...}}] }}
        - constraints: {{ required: [], forbidden: [] }}
        
        Ensure "id" matches the topic slug '{topic}' roughly.
        Only return valid JSON.
        """
        
        response = model_service.generate_response(prompt, max_tokens=1024)
        
        try:
            # Clean JSON
            clean_json = response.strip()
            
            # Robust JSON extraction
            if "```json" in clean_json:
                clean_json = clean_json.split("```json")[1].split("```")[0].strip()
            elif "```" in clean_json:
                clean_json = clean_json.split("```")[1].split("```")[0].strip()
            elif "{" in clean_json:
                # Find start and end of JSON object
                start = clean_json.find("{")
                end = clean_json.rfind("}")
                if start != -1 and end != -1:
                    clean_json = clean_json[start:end+1]
            
            if not clean_json:
                print(f"[CodingService] ERROR: AI response was empty or contained no JSON blocks. Raw: {response[:100]}...")
                raise ValueError("AI response empty")
                
            data = json.loads(clean_json)
            
            # Ensure ID match
            data["id"] = topic
            
            # Validate with Pydantic
            lesson = LessonDefinition(**data)
            
            # Save to DB
            new_content = GeneratedContent(
                type='coding_lesson',
                title=topic, # ID
                content=json.dumps(data),
                user_id=None # System-generated
            )
            db.add(new_content)
            db.commit()
            
            return lesson
        except Exception as e:
            print(f"Error generating lesson: {e}")
            # Fallback
            return LessonDefinition(
                id=topic,
                title=f"Error Generating {topic}",
                language=Language.PYTHON,
                notes="AI generation failed. Please try again.",
                spec=LessonSpec(function_name="error", parameters=[], return_type="none", test_cases=[]),
                constraints=LessonConstraints()
            )

    def generate_feedback(self, lesson: LessonDefinition, code: str, result: GradingResult) -> str:
        """Generate AI feedback based on grading result."""
        prompt = f"""
        The student submitted the following code for the lesson '{lesson.title}':
        
        Code:
        {code}
        
        Grading Result:
        Status: {result.status}
        Score: {result.score}
        Message: {result.message}
        Details: {result.details}
        
        Provide helpful, constructive feedback. 
        - If incorrect, explain why and give a hint (do not give the full answer).
        - If correct, congratulate and suggest a way to optimize or a related advanced concept.
        - Be brief (max 3-4 sentences).
        """
        return model_service.generate_response(prompt, max_tokens=300)

coding_service = LessonService()
