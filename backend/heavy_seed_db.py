import os
import sys
import json
import random
import datetime
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend directory to path so we can import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import db_session, Course, Module, SubTopic, User, Enrollment, Note, ActivityLog, Assessment
from app.features.auth.service import auth_service

# --- CONFIGURATION ---
NUM_USERS = 50
CODING_COURSES_COUNT = 10
ORDINARY_COURSES_COUNT = 10
HOURS_PER_COURSE = 50
MODULES_PER_COURSE = 10  # 5 hours per module
TOPICS_PER_MODULE = 3

# --- DATA POOLS ---
FIRST_NAMES = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]

CODING_SUBJECTS = [
    ("Python for Data Science", "Master Python, Pandas, and NumPy for real-world data analysis."),
    ("Modern Web Dev with React", "Building scalable frontends with React, Vite, and Tailwind."),
    ("AI & Machine Learning Foundations", "Neural networks, regression, and generative AI models."),
    ("Full-Stack JavaScript", "Node.js, Express, and MongoDB mastery."),
    ("Cybersecurity Essentials", "Network security, ethical hacking, and threat mitigation."),
    ("Database Engineering", "SQL, NoSQL, and high-performance indexing."),
    ("Mobile App Dev with Flutter", "Cross-platform mobile apps for iOS and Android."),
    ("Game Development (Unity)", "C# and 3D environment orchestration."),
    ("Cloud Architecture (AWS)", "Scaling infrastructure on the world's leading cloud."),
    ("Rust Systems Programming", "Memory safety and high-performance system tooling.")
]

ORDINARY_SUBJECTS = [
    ("Cognitive Psychology", "Exploring the architecture of the human mind."),
    ("Global Economics & Trade", "Supply chains, macro-policies, and emerging markets."),
    ("Modern African History", "Liberation movements, post-colonial growth, and MSU heritage."),
    ("Business Communication", "Professional writing and strategic negotiation."),
    ("Digital Ethics & Law", "Navigating the legal landscape of the internet era."),
    ("Introduction to Philosophy", "Logic, metaphysics, and the search for meaning."),
    ("Sustainable Development", "Environmental science and global green initiatives."),
    ("Creative Writing & Narratives", "Storytelling techniques for modern media."),
    ("Global Marketing Strategy", "Building brands that resonate across borders."),
    ("Project Management (Agile)", "Leading teams with Scrum, Kanban, and precision.")
]

# --- UTILS ---
def generate_real_name():
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"

def clear_db():
    print("Clearing existing data...")
    db_session.query(ActivityLog).delete()
    db_session.query(Note).delete()
    db_session.query(Enrollment).delete()
    db_session.query(SubTopic).delete()
    db_session.query(Module).delete()
    db_session.query(Assessment).delete()
    db_session.query(Course).delete()
    db_session.query(User).filter(User.email != "admin@msu.edu").delete() # Keep admin if exists
    db_session.commit()

def seed_users():
    print(f"Creating {NUM_USERS} users...")
    users = []
    
    # 1. Main Tutor (Musa)
    musa = User(
        first_name="Musa",
        last_name="Tutor",
        full_name="Musa the Tutor",
        username="musa_tutor",
        email="tutor@edu.com",
        hashed_password=auth_service.get_password_hash("tutor123"),
        role="tutor",
        title="Dr",
        department="Computer Science",
        pay_number="STAFF001",
        institutional_name="Midlands State University",
        gender="Male",
        dob=datetime.datetime(1985, 5, 20),
        terms_accepted=True,
        privacy_accepted=True,
        data_consent_accepted=True
    )
    users.append(musa)
    
    # 2. Main Student
    alex = User(
        first_name="Alex",
        last_name="Student",
        full_name="Alex Student",
        username="alex_student",
        email="student@msu.edu",
        hashed_password=auth_service.get_password_hash("password123"),
        role="student",
        institutional_name="Midlands State University",
        gender="Male",
        dob=datetime.datetime(2003, 10, 15),
        terms_accepted=True,
        privacy_accepted=True,
        data_consent_accepted=True
    )
    users.append(alex)
    
    # 3. Random Users
    for i in range(NUM_USERS - 2):
        role = "student"
        if random.random() < 0.2: role = "tutor"
        
        fname = random.choice(FIRST_NAMES)
        lname = random.choice(LAST_NAMES)
        mname = random.choice(FIRST_NAMES) if random.random() > 0.5 else None
        
        name = f"{fname} {lname}"
        uname = fname.lower() + f"_{random.randint(100, 999)}_{i}"
        email = f"{uname}@msu_online.edu"
        
        u = User(
            first_name=fname,
            last_name=lname,
            middle_name=mname,
            full_name=f"{fname} {mname + ' ' if mname else ''}{lname}",
            username=uname,
            email=email,
            hashed_password=auth_service.get_password_hash("password123"),
            role=role,
            gender=random.choice(["Male", "Female"]),
            dob=datetime.datetime(random.randint(1970, 2005), random.randint(1, 12), random.randint(1, 28)),
            mobile_number=f"+26377{random.randint(1000000, 9999999)}",
            national_id=f"{random.randint(10, 99)}-{random.randint(100000, 999999)}-X-{random.randint(10, 99)}",
            institutional_name="Midlands State University",
            terms_accepted=True,
            privacy_accepted=True,
            data_consent_accepted=True
        )
        
        if role == "tutor":
            u.title = random.choice(["Mr", "Mrs", "Dr", "Prof"])
            u.department = random.choice(["Engineering", "Science", "Arts", "Business"])
            u.pay_number = f"PAY{random.randint(1000, 9999)}"
            
        users.append(u)
    
    db_session.add_all(users)
    db_session.commit()
    return users

def seed_courses(tutors):
    print("Creating 20 courses with full roadmaps...")
    all_courses = []
    
    subject_list = [(s, True) for s in CODING_SUBJECTS] + [(s, False) for s in ORDINARY_SUBJECTS]
    
    for (title, desc), is_prog in subject_list:
        course = Course(
            title=title,
            description=desc,
            total_hours=HOURS_PER_COURSE,
            is_programming=is_prog,
            credit_value=random.choice([2, 3, 4]),
            tutor_id=random.choice(tutors).id
        )
        db_session.add(course)
        db_session.commit() # Need ID for modules
        
        # Add 10 Modules
        for m_idx in range(MODULES_PER_COURSE):
            mod = Module(
                course_id=course.id,
                title=f"Module {m_idx + 1}: {title.split(' ')[0]} Exploration",
                description=f"Deep dive into the {m_idx + 1}th phase of {title}.",
                duration="5 Hours",
                order=m_idx,
                locked=m_idx > 3
            )
            db_session.add(mod)
            db_session.commit()
            
            # Add SubTopics
            for t_idx in range(TOPICS_PER_MODULE):
                st = SubTopic(
                    module_id=mod.id,
                    title=f"Topic {m_idx + 1}.{t_idx + 1}",
                    content=f"Detailed academic content for {title} - Session {m_idx}.{t_idx}. This roadmap covers 50 hours of intensive learning.",
                    order=t_idx,
                    practice_code="def solution():\n    return True" if is_prog else None
                )
                db_session.add(st)
        
        all_courses.append(course)
    
    db_session.commit()
    return all_courses

def seed_lived_in_data(users, courses):
    print("Seeding activity logs, notes, and enrollments...")
    students = [u for u in users if u.role == "student"]
    
    for student in students:
        # Enroll in 3-5 random courses
        enrolled = random.sample(courses, k=random.randint(3, 5))
        for c in enrolled:
            enrollment = Enrollment(
                user_id=student.id,
                course_id=c.id,
                status=random.choice(["active", "active", "completed"]),
                progress_percent=random.uniform(0, 95)
            )
            db_session.add(enrollment)
            
            # Add some notes for these courses
            if random.random() < 0.7:
                note = Note(
                    user_id=student.id,
                    course_id=c.id,
                    title=f"My Notes on {c.title}",
                    content=f"Captured some great insights during the {student.full_name}'s study session today. Important for the final exam."
                )
                db_session.add(note)
        
        # Activity Logs
        for _ in range(random.randint(5, 15)):
            log = ActivityLog(
                user_id=student.id,
                activity_type=random.choice(["chat_query", "exercise_submit", "textbook_view", "note_saved"]),
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 30))
            )
            db_session.add(log)
            
    db_session.commit()

if __name__ == "__main__":
    clear_db()
    all_users = seed_users()
    tutors = [u for u in all_users if u.role == "tutor"]
    courses = seed_courses(tutors)
    seed_lived_in_data(all_users, courses)
    print("\nSUCCESS: MSU Online System Scaled!")
    print(f"- Users: {len(all_users)} (Tutor Musa: tutor@edu.com / tutor123)")
    print("- Courses: 20 (10 Coding, 10 Ordinary)")
    print("- Roadmap: 50 Hours per course (10 Modules x 5h)")
    print("- Activity: Simulated for all 50 people.")
