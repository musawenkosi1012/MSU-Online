"""
Core Database Module
Professional SQLAchemy schema for EduNexus AI.
"""
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, Boolean, DateTime, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy import create_engine
import datetime
import os
from dotenv import load_dotenv

# Load .env file if it exists
load_dotenv()

Base = declarative_base()

# ============================================
# ASSOCIATION TABLES
# ============================================

class Enrollment(Base):
    __tablename__ = 'enrollments'
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id'), primary_key=True)
    status = Column(String(50), default="active") # active, completed, dropped
    enrolled_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_accessed = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    progress_percent = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

# ============================================
# CORE ENTITIES
# ============================================

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    full_name = Column(String(255), nullable=False) # Concatenated
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="student") # student, tutor, admin
    
    # New Profile Fields
    dob = Column(DateTime, nullable=True)
    mobile_number = Column(String(50), nullable=True)
    national_id = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    institutional_name = Column(String(255), nullable=True)
    
    # Tutor Specific Fields
    title = Column(String(20), nullable=True) # Mr/Mrs/Miss/Dr
    department = Column(String(100), nullable=True)
    pay_number = Column(String(50), nullable=True)
    
    # Consents
    terms_accepted = Column(Boolean, default=False)
    privacy_accepted = Column(Boolean, default=False)
    data_consent_accepted = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    enrollments = relationship("Enrollment", back_populates="user", cascade="all, delete-orphan")
    courses_created = relationship("Course", back_populates="tutor")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="user", cascade="all, delete-orphan")
    submissions = relationship("AssessmentSubmission", back_populates="user", cascade="all, delete-orphan")
    ai_sessions = relationship("AISession", back_populates="user", cascade="all, delete-orphan")
    performance = relationship("StudentPerformance", back_populates="user", cascade="all, delete-orphan")
    research_results = relationship("ResearchResult", back_populates="user", cascade="all, delete-orphan")
    generated_content = relationship("GeneratedContent", back_populates="user", cascade="all, delete-orphan")
    settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")

class UserSettings(Base):
    __tablename__ = 'user_settings'
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    account_identity = Column(Text, nullable=True) # JSON
    security_access = Column(Text, nullable=True) # JSON
    privacy_sharing = Column(Text, nullable=True) # JSON
    notifications = Column(Text, nullable=True) # JSON
    learning_preferences = Column(Text, nullable=True) # JSON (Student only)
    teaching_controls = Column(Text, nullable=True) # JSON (Tutor only)
    skill_evaluation = Column(Text, nullable=True) # JSON 
    billing_monetization = Column(Text, nullable=True) # JSON
    integrations_api = Column(Text, nullable=True) # JSON
    system_institutional = Column(Text, nullable=True) # JSON (Admin only)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="settings")

class Course(Base):
    __tablename__ = 'courses'
    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    total_hours = Column(Integer, default=100)
    is_programming = Column(Boolean, default=False)
    credit_value = Column(Integer, default=3)
    tutor_id = Column(Integer, ForeignKey('users.id'))
    
    # Relationships
    tutor = relationship("User", back_populates="courses_created")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    modules = relationship("Module", back_populates="course", order_by="Module.order", cascade="all, delete-orphan")
    materials = relationship("CourseMaterial", back_populates="course", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="course", cascade="all, delete-orphan")
    analytics = relationship("CourseAnalytics", back_populates="course", cascade="all, delete-orphan")
    generated_content = relationship("GeneratedContent", back_populates="course")

class Module(Base):
    __tablename__ = 'modules'
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id'))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    expected_outcome = Column(Text)
    duration = Column(String(50))
    order = Column(Integer, default=0)
    locked = Column(Boolean, default=True)
    
    # Relationships
    course = relationship("Course", back_populates="modules")
    sub_topics = relationship("SubTopic", back_populates="module", order_by="SubTopic.order", cascade="all, delete-orphan")

class SubTopic(Base):
    __tablename__ = 'sub_topics'
    id = Column(Integer, primary_key=True)
    module_id = Column(Integer, ForeignKey('modules.id'))
    title = Column(String(255), nullable=False)
    content = Column(Text)
    practice_code = Column(Text, nullable=True)
    order = Column(Integer, default=0)
    
    # Relationships
    module = relationship("Module", back_populates="sub_topics")
    performance_records = relationship("StudentPerformance", back_populates="sub_topic")

# ============================================
# PERFORMANCE & INTELLIGENCE
# ============================================

class StudentPerformance(Base):
    __tablename__ = 'student_performance'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    course_id = Column(Integer, ForeignKey('courses.id'))
    sub_topic_id = Column(Integer, ForeignKey('sub_topics.id'), nullable=True)
    topic_id = Column(String(100), index=True)
    mastery = Column(Float, default=0.0)
    attempts = Column(Integer, default=0)
    duration_seconds = Column(Integer, default=0)
    passed = Column(Boolean, default=False)
    last_attempt = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="performance")
    sub_topic = relationship("SubTopic", back_populates="performance_records")

class Assessment(Base):
    __tablename__ = 'assessments'
    id = Column(String(100), primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id'))
    topic_id = Column(String(100), index=True)
    type = Column(String(50))
    content_json = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    course = relationship("Course", back_populates="assessments")

class AssessmentSubmission(Base):
    __tablename__ = 'assessment_submissions'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    assessment_id = Column(String(100), index=True)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=True)
    score = Column(Float)
    raw_score = Column(Float, nullable=True)
    max_score = Column(Float, nullable=True)
    source = Column(String(50)) # exercise, chapter_exercise, final_exam
    type = Column(String(50)) # mcq, open, mixed
    results_json = Column(Text)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="submissions")

class AISession(Base):
    __tablename__ = 'ai_sessions'
    id = Column(Integer, primary_key=True)
    session_id = Column(String(50), unique=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    mode = Column(String(20))
    course_id = Column(String(50), nullable=True)
    topic_id = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    mastery = Column(Float, default=0.0)
    hints_used = Column(Integer, default=0)
    messages_json = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="ai_sessions")

# ============================================
# UTILITIES & LOGS
# ============================================

class CourseMaterial(Base):
    __tablename__ = 'course_materials'
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id'))
    type = Column(String(50))
    title = Column(String(255))
    content = Column(Text)
    url = Column(String(500), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    course = relationship("Course", back_populates="materials")

class Note(Base):
    __tablename__ = 'notes'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=True)
    title = Column(String(255))
    content = Column(Text)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="notes")
    course = relationship("Course")

class ActivityLog(Base):
    __tablename__ = 'activity_logs'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    activity_type = Column(String(100))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="activity_logs")

class CourseAnalytics(Base):
    __tablename__ = "course_analytics"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    course_id = Column(Integer, ForeignKey('courses.id'), index=True)
    exercise_score = Column(Float, default=0.0)
    final_exam_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    course = relationship("Course", back_populates="analytics")
    user = relationship("User")

class ResearchResult(Base):
    __tablename__ = 'research_results'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    query = Column(String(500), index=True)
    results_json = Column(Text) # Cached search results
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="research_results")

class GeneratedContent(Base):
    """Stores AI-generated essays, textbooks, or lesson plans."""
    __tablename__ = 'generated_content'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=True)
    type = Column(String(50)) # essay, textbook, lesson_plan
    title = Column(String(255))
    content = Column(Text)
    metadata_json = Column(Text, nullable=True) # Sources, word count, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    status = Column(String(50), default="pending") # pending, approved, rejected
    
    user = relationship("User", back_populates="generated_content")
    course = relationship("Course", back_populates="generated_content")

# ============================================
# INITIALIZATION
# ============================================

# Handle DB path dynamically for Render (Linux) and Local (Windows)
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_BASE_DB_PATH = os.path.join(_BACKEND_DIR, "unstoppable_minds.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{_BASE_DB_PATH}")

# MySQL transition: If URL starts with mysql, ensure it uses pymysql driver
if DATABASE_URL.startswith("mysql://"):
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)

# SQLite needs check_same_thread: False for FastAPI
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
elif "mysql" in DATABASE_URL:
    # Production SSL Configuration for remote MySQL
    ssl_ca = os.getenv("DB_SSL_CA")
    if ssl_ca and os.path.exists(ssl_ca):
        connect_args = {
            "ssl": {
                "ca": ssl_ca
            }
        }

engine = create_engine(DATABASE_URL, connect_args=connect_args)
Base.metadata.create_all(engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_session = SessionLocal()
