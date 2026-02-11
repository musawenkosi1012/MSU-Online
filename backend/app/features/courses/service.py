"""
Course Service
Professional database-driven course management.
"""
from sqlalchemy.orm import Session
from app.core.database import Course, Module, Enrollment, SessionLocal
from sqlalchemy.orm import joinedload
from typing import List, Optional

# ============================================
# COURSES CATALOG DATA (Static fallback)
# ============================================

COURSES_CATALOG = [
    {
        "id": "course-1",
        "title": "Mastering Information Architecture",
        "category": "UX Design",
        "level": "Intermediate",
        "format": "Hybrid",
        "featured": True,
        "description": "Learn the foundations of organizing, structuring, and labeling content effectively for digital products.",
        "shortDescription": "Master the art of organizing digital content for optimal user experience."
    },
    {
        "id": "course-2",
        "title": "Introduction to Machine Learning",
        "category": "AI & Data Science",
        "level": "Beginner",
        "format": "Video",
        "featured": True,
        "description": "A comprehensive introduction to machine learning algorithms, neural networks, and practical AI applications.",
        "shortDescription": "Start your AI journey with hands-on ML projects."
    }
]

class CourseService:
    def __init__(self):
        self.static_courses = COURSES_CATALOG
    
    def get_all_courses(self, category=None, level=None, format_type=None, search=None, db: Session = None, user_id: int = None):
        """Get all courses (Merging DB + Static) with user enrollment status."""
        _db = db or SessionLocal()
        try:
            # 1. Fetch from DB
            db_courses = _db.query(Course).options(
                joinedload(Course.modules).joinedload(Module.sub_topics)
            ).all()
            
            # 2. Get User Enrollments
            enrolled_ids = []
            if user_id:
                enrolled_ids = [str(e.course_id) for e in _db.query(Enrollment).filter(Enrollment.user_id == user_id).all()]
            
            # 3. Map DB Courses
            mapped_db_courses = []
            for c in db_courses:
                mapped_db_courses.append({
                    "id": str(c.id),
                    "title": c.title,
                    "description": c.description,
                    "shortDescription": (c.description or "")[:100] + "...",
                    "category": "Computer Science",
                    "level": "General",
                    "format": "Hybrid",
                    "enrolled": str(c.id) in enrolled_ids,
                    "is_programming": c.is_programming
                })
            
            # 4. Map Static Courses (Removed to match DB)
            # mapped_static = []
            # for c in self.static_courses:
            #     mapped_static.append({
            #         **c,
            #         "enrolled": c['id'] in enrolled_ids
            #     })
                
            all_courses = mapped_db_courses
            
            # 5. Filter
            filtered = all_courses
            if category:
                filtered = [c for c in filtered if c.get('category', '').lower() == category.lower()]
            if level:
                filtered = [c for c in filtered if c.get('level', '').lower() == level.lower()]
            if search:
                s = search.lower()
                filtered = [c for c in filtered if s in c['title'].lower() or s in c['description'].lower()]
                
            return filtered
        finally:
            if db is None: _db.close()

    def get_course_by_id(self, course_id: str, db: Session = None, user_id: int = None):
        """Get a specific course with full context."""
        _db = db or SessionLocal()
        try:
            c_int_id = int(course_id) if course_id.isdigit() else None
            if c_int_id:
                course = _db.query(Course).options(
                    joinedload(Course.modules).joinedload(Module.sub_topics)
                ).filter(Course.id == c_int_id).first()
                
                if course:
                    enrolled = False
                    if user_id:
                        enrolled = _db.query(Enrollment).filter(
                            Enrollment.user_id == user_id, 
                            Enrollment.course_id == course.id
                        ).first() is not None

                    return {
                        "id": str(course.id),
                        "title": course.title,
                        "description": course.description,
                        "category": "Computer Science",
                        "level": "General",
                        "format": "Hybrid",
                        "enrolled": enrolled,
                        "is_programming": course.is_programming,
                        "modules": [{
                            "id": m.id,
                            "module_id": m.id,
                            "title": m.title,
                            "description": m.description,
                            "expected_outcome": m.expected_outcome,
                            "duration": m.duration,
                            "locked": m.locked,
                            "topics": [{
                                "id": s.id,
                                "topic_id": s.id,
                                "title": s.title,
                                "content": s.content,
                                "practice_code": s.practice_code
                            } for s in m.sub_topics]
                        } for m in course.modules]
                    }
            
            # Fallback to static or all courses if not found in DB
            courses = self.get_all_courses(db=_db, user_id=user_id)
            for c in courses:
                if str(c['id']) == str(course_id):
                    return c
            return None
        finally:
            if db is None: _db.close()

    def enroll(self, user_id: int, course_id: str, db: Session):
        """Enroll a user in a course professionally."""
        # Convert course_id to int if possible (for DB courses)
        try:
            db_course_id = int(course_id)
        except ValueError:
            # Handle static course IDs if necessary, though in a real app everything is DB
            db_course_id = 999 

        existing = db.query(Enrollment).filter(
            Enrollment.user_id == user_id,
            Enrollment.course_id == db_course_id
        ).first()
        
        if not existing:
            new_enroll = Enrollment(user_id=user_id, course_id=db_course_id)
            db.add(new_enroll)
            db.commit()
            return {"status": "success", "message": "Enrolled successfully"}
        return {"status": "already_enrolled"}

    def get_enrolled_courses(self, user_id: int, db: Session):
        """Get courses a student is actually enrolled in."""
        return [c for c in self.get_all_courses(db=db, user_id=user_id) if c.get('enrolled')]

    def get_repository(self, course_id: str):
        """Mock repository logic (could be linked to DB Materials table)."""
        return {
            "materials": [
                {"id": "mat-1", "title": "Core Curriculum Archive", "type": "pdf"},
                {"id": "mat-2", "title": "Research Database", "type": "link"}
            ],
            "questions": [
                {"id": 1, "question": "Explain the foundational principles.", "text": "Analysis required."}
            ]
        }

    def get_categories(self):
        return ["UX Design", "AI & Data Science", "Programming", "Health", "Languages", "Computer Science"]

    def get_levels(self):
        return ["Beginner", "Intermediate", "Advanced", "General"]

    def get_formats(self):
        return ["Video", "Text", "Hybrid"]

course_service = CourseService()
