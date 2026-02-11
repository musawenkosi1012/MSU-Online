from database import db_session, Course, Module, PerformanceMetric, User, CourseMaterial, QuestionBank
from auth_service import auth_service
import datetime
import os

def seed_data():
    # Check if data already exists
    if db_session.query(Course).first():
        print("Course data already seeded.")
    else:
        # Add Course
        course = Course(
            title="Mastering Information Design",
            description="A comprehensive university-level track covering data visualization, architectural logic, and UX writing.",
            total_hours=100
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
                progress=100 if i == 0 else (45 if i == 1 else 0)
            )
            db_session.add(mod)
        
        # Add Sample Metrics
        db_session.add(PerformanceMetric(metric_name='gpa', value=3.8))
        db_session.add(PerformanceMetric(metric_name='study_hours', value=12.0))
        db_session.add(PerformanceMetric(metric_name='progress_percentage', value=45.0))

        # Add Sample Question Bank
        questions = [
            {
                "text": "What is the primary goal of Information Architecture?",
                "options": "[\"Visual design\", \"Content organization\", \"Network security\", \"Database tuning\"]",
                "correct": "Content organization",
                "type": "mcq",
                "difficulty": "easy"
            },
            {
                "text": "Explain the difference between Top-down and Bottom-up IA.",
                "options": None,
                "correct": "Top-down starts from high level...",
                "type": "essay",
                "difficulty": "medium"
            }
        ]
        
        for q in questions:
            db_session.add(QuestionBank(
                course_id=course.id,
                question_text=q['text'],
                options=q['options'],
                correct_answer=q['correct'],
                type=q['type'],
                difficulty=q['difficulty']
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
