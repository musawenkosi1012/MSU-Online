
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal, User, Course, Enrollment, Base, engine
from app.features.courses.service import course_service

def run_check():
    print("--- Professional Database Relationship Check ---")
    
    # 1. Reset/Ensure tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 2. Create Test Student
        student = User(
            full_name="Testing Student",
            email="student@test.com",
            hashed_password="fakehash",
            role="student"
        )
        db.add(student)
        db.flush()
        
        # 3. Create Test Course
        course = Course(
            title="Advanced AI Training",
            description="Deep dive into neural networks",
            tutor_id=1 # Assuming student/tutor exists
        )
        db.add(course)
        db.flush()
        
        print(f"Created Student (ID: {student.id}) and Course (ID: {course.id})")
        
        # 4. Check initial enrollment status
        courses = course_service.get_all_courses(db=db, user_id=student.id)
        db_course = next(c for c in courses if c['title'] == "Advanced AI Training")
        print(f"Initial Enrollment Status: {db_course['enrolled']}")
        
        # 5. Enroll Student
        print("Enrolling student...")
        course_service.enroll(student.id, str(course.id), db)
        
        # 6. Verify Relationship
        enrollment = db.query(Enrollment).filter_by(user_id=student.id, course_id=course.id).first()
        if enrollment:
            print(f"[SUCCESS] Enrollment record found in DB (Enrolled at: {enrollment.enrolled_at})")
        else:
            print("[FAILURE] Enrollment record NOT found!")
            
        # 7. Check if Course list reflects enrollment
        courses_after = course_service.get_all_courses(db=db, user_id=student.id)
        db_course_after = next(c for c in courses_after if c['title'] == "Advanced AI Training")
        print(f"Post-Enrollment Status: {db_course_after['enrolled']}")
        
        if db_course_after['enrolled']:
            print("[SUCCESS] SYSTEM RESPONSE VERIFIED: Enrollment status propagated correctly.")
        else:
            print("[FAILURE] SYSTEM RESPONSE FAILED: Enrollment status not updated.")
            
    finally:
        db.close()

if __name__ == "__main__":
    run_check()
