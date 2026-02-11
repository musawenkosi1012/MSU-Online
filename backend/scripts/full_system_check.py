
import sys
import os
import asyncio
import json
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal, User, Course, Enrollment, AISession, ResearchResult, GeneratedContent, Base, engine
from app.features.courses.service import course_service
from app.features.ai_tutor.session_service import ai_session_service
from app.features.research.service import research_service

def print_pass(msg):
    print(f"[PASS] {msg}")

def print_fail(msg):
    print(f"[FAIL] {msg}")

async def run_full_check():
    print("==============================================")
    print("      EDUNEXUS FULL SYSTEM INTEGRITY CHECK    ")
    print("==============================================")
    
    # 1. Reset Database
    print("\n1. RESETTING DATABASE...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 2. User Registration
        print("\n2. CREATING USER...")
        student = User(
            full_name="System Tester",
            email="tester@edunexus.ai",
            hashed_password="hashed_secret",
            role="student"
        )
        db.add(student)
        db.flush()
        print_pass(f"User created with ID: {student.id}")
        
        # 3. Course Creation
        print("\n3. CREATING COURSE...")
        course = Course(
            title="Advanced System Architecture",
            description="Testing deep system integrations.",
            tutor_id=student.id
        )
        db.add(course)
        db.flush()
        print_pass(f"Course created with ID: {course.id}")
        
        # 4. Enrollment Check
        print("\n4. TESTING ENROLLMENT...")
        enroll_result = course_service.enroll(student.id, str(course.id), db)
        if enroll_result['status'] == "success":
            enrollment = db.query(Enrollment).filter_by(user_id=student.id, course_id=course.id).first()
            if enrollment:
                print_pass("Enrollment record persisted in DB.")
            else:
                print_fail("Enrollment record missing from DB.")
        else:
            print_fail(f"Enrollment failed: {enroll_result}")
            
        # 5. Chat Session Check
        print("\n5. TESTING AI CHAT SESSION...")
        session_data = ai_session_service.create_session(str(student.id), "chat", str(course.id))
        session_id = session_data['session_id']
        
        ai_session_service.add_chat_message(session_id, "user", "Hello Musa!")
        ai_session_service.add_chat_message(session_id, "assistant", "Hello! How can I help you today?")
        
        db_session = db.query(AISession).filter_by(session_id=session_id).first()
        if db_session:
            print_pass(f"AI Session persisted (ID: {session_id})")
            msgs = json.loads(db_session.messages_json)
            if len(msgs) == 2:
                print_pass(f"Message history persisted correctly ({len(msgs)} messages).")
            else:
                print_fail(f"Message history mismatch: found {len(msgs)}")
        else:
            print_fail("AI Session missing from DB.")

        # 6. Research & Generation Check (Mocked Scraper)
        print("\n6. TESTING RESEARCH & CONTENT GENERATION...")
        
        # Mocking scraper search to avoid real network calls in test
        class MockScraper:
            async def search(self, query, max_results):
                return [{"title": "Test Source", "url": "http://test.com", "content_clean": "This is a test source content."}]
        
        research_service.scraper = MockScraper()
        
        # We need to mock model_service too since we can't run LLM in this script easily without API keys
        class MockLLM:
            def generate_response(self, prompt, max_tokens):
                if "outline" in prompt:
                    return '{"title": "Test Essay", "sections": [{"heading": "Intro", "instruction": "Write intro"}]}'
                return "This is generated content for the section."
                
        research_service.llm = MockLLM()
        
        # Run Generation
        result = await research_service.generate_deep_essay(str(student.id), "Future of AI", "academic", db)
        
        if result.get("saved"):
            print_pass("Essay generation completed and saved flag is True.")
            
            # Verify ResearchResult
            res_record = db.query(ResearchResult).filter_by(user_id=student.id).first()
            if res_record:
                print_pass(f"ResearchResult persisted (Query: {res_record.query})")
            else:
                print_fail("ResearchResult NOT found in DB.")
                
            # Verify GeneratedContent
            content_record = db.query(GeneratedContent).filter_by(user_id=student.id).first()
            if content_record:
                print_pass(f"GeneratedContent persisted (Title: {content_record.title})")
                if content_record.type == "essay":
                    print_pass("Content type matches 'essay'.")
            else:
                print_fail("GeneratedContent NOT found in DB.")
        else:
            print_fail(f"Essay generation failed or not saved: {result}")

    except Exception as e:
        print_fail(f"System Check Error: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        db.close()
        print("\n--- CHECK COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(run_full_check())
