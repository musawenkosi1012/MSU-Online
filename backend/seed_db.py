import os
import sys
import json
import datetime

# Add current directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import db_session, Course, Module, User, CourseMaterial, Assessment
from app.features.auth.service import auth_service

def seed_data():
    # Check if data already exists
    if db_session.query(Course).first():
        print("Course data already seeded.")
    else:
        # Add Course
        course = Course(
            title="Mastering Information Design",
            description="A comprehensive university-level track covering data visualization, architectural logic, and UX writing.",
            total_hours=100,
            credit_value=3
        )
        db_session.add(course)
        db_session.commit()

        # Add Modules
        module_titles = [
            "Foundations of Information Architecture",
            "Cognitive Psychology & Design",
            "Typography for Data",
            "Grid Systems & Layouts",
            "Quantitative Data Visualization",
            "Qualitative Information Mapping",
            "User Experience Writing",
            "Interactive Systems Design",
            "Ethics in Information",
            "Capstone Project: The Big Data Dashboard"
        ]
        
        for i, title in enumerate(module_titles):
            mod = Module(
                course_id=course.id,
                title=title,
                duration="10 Hours",
                locked=i > 2,
                order=i
            )
            db_session.add(mod)
        
        # Add Assessments (Replacement for QuestionBank)
        assessment_data = [
            {
                "id": "intro_ia_quiz",
                "topic_id": "ia_foundations",
                "type": "mcq",
                "content": {
                    "question": "What is the primary goal of Information Architecture?",
                    "options": ["Visual design", "Content organization", "Network security", "Database tuning"],
                    "answer": "Content organization"
                }
            }
        ]
        
        for a in assessment_data:
            db_session.add(Assessment(
                id=a['id'],
                course_id=course.id,
                topic_id=a['topic_id'],
                type=a['type'],
                content_json=json.dumps(a['content'])
            ))

        db_session.commit()
        print("Course data seeded successfully.")

    # Seed Student User
    test_email = "student@msu.edu"
    if db_session.query(User).filter(User.email == test_email).first():
        print("Student user already exists.")
    else:
        test_user = User(
            full_name="Alex Student",
            email=test_email,
            hashed_password=auth_service.get_password_hash("password123"),
            role="student"
        )
        db_session.add(test_user)
        print("Student user created.")

    # Seed Tutor User
    tutor_email = "tutor@edu.com"
    if db_session.query(User).filter(User.email == tutor_email).first():
        print("Tutor user already exists.")
    else:
        tutor_user = User(
            full_name="Musa",
            email=tutor_email,
            hashed_password=auth_service.get_password_hash("tutor123"),
            role="tutor"
        )
        db_session.add(tutor_user)
        print("Tutor user created.")

    db_session.commit()

if __name__ == "__main__":
    seed_data()
