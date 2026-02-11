from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Course, User, GeneratedContent

engine = create_engine('sqlite:///unstoppable_minds.db')
Session = sessionmaker(bind=engine)
session = Session()

print("--- USERS ---")
users = session.query(User).all()
for u in users:
    print(f"ID: {u.id}, Name: {u.full_name}, Email: {u.email}, Role: {u.role}")

print("\n--- COURSES ---")
courses = session.query(Course).all()
for c in courses:
    print(f"ID: {c.id}, Title: {c.title}, Tutor ID: {c.tutor_id}")

print("\n--- GENERATED CONTENT ---")
textbooks = session.query(GeneratedContent).all()
for t in textbooks:
    print(f"ID: {t.id}, Course ID: {t.course_id}, User ID: {t.user_id}, Type: {t.type}, Status: {t.status}")

session.close()
