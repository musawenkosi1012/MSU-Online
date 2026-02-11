from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import Course, GeneratedContent, StudentPerformance, User, Module, SubTopic
import datetime

class TutorService:
    @staticmethod
    def get_dashboard_stats(db: Session):
        total_verified = db.query(GeneratedContent).filter(GeneratedContent.status == 'approved', GeneratedContent.type == 'textbook').count()
        pending_review = db.query(GeneratedContent).filter(GeneratedContent.status == 'pending', GeneratedContent.type == 'textbook').count()
        
        # Ave Credibility: difference between accepted and rejected (as a ratio or percentage)
        total_rejected = db.query(GeneratedContent).filter(GeneratedContent.status == 'rejected', GeneratedContent.type == 'textbook').count()
        total_handled = total_verified + total_rejected
        avg_credibility = (total_verified / total_handled) if total_handled > 0 else 1.0
        
        return {
            "verified_count": total_verified,
            "review_queue_count": pending_review,
            "avg_credibility": avg_credibility
        }

    @staticmethod
    def get_review_queue(db: Session):
        from sqlalchemy.orm import joinedload
        items = db.query(GeneratedContent).options(joinedload(GeneratedContent.course)).filter(
            GeneratedContent.status == 'pending', 
            GeneratedContent.type == 'textbook'
        ).all()
        return [{
            "id": c.id,
            "title": c.title,
            "course_title": c.course.title if c.course else "Unknown Course",
            "status": c.status,
            "created_at": str(c.created_at)
        } for c in items]

    @staticmethod
    def get_recently_verified(db: Session, limit: int = 5):
        from sqlalchemy.orm import joinedload
        items = db.query(GeneratedContent).options(joinedload(GeneratedContent.course)).filter(
            GeneratedContent.status == 'approved', 
            GeneratedContent.type == 'textbook'
        ).order_by(GeneratedContent.created_at.desc()).limit(limit).all()
        return [{
            "id": c.id,
            "title": c.title,
            "course_title": c.course.title if c.course else "Unknown Course",
            "status": c.status,
            "created_at": str(c.created_at)
        } for c in items]

    @staticmethod
    def get_tutor_courses(db: Session, tutor_id: int):
        return db.query(Course).filter(Course.tutor_id == tutor_id).all()

    @staticmethod
    def create_course(db: Session, tutor_id: int, course_data: dict):
        new_course = Course(
            title=course_data['title'],
            description=course_data.get('description', ''),
            total_hours=course_data.get('total_hours', 10),
            is_programming=course_data.get('is_programming', False),
            tutor_id=tutor_id
        )
        db.add(new_course)
        db.commit()
        db.refresh(new_course)
        return new_course

    @staticmethod
    def update_course_outline(db: Session, course_id: int, outline: list):
        # Outline is a list of modules, each with sub_topics
        # Clear existing modules/subtopics for simplicity in this MVP sync
        # In a real app, we'd do smart updates, but here we rebuild the tree
        
        # Delete existing
        modules = db.query(Module).filter(Module.course_id == course_id).all()
        for m in modules:
            db.query(SubTopic).filter(SubTopic.module_id == m.id).delete()
        db.query(Module).filter(Module.course_id == course_id).delete()
        
        # Add new
        for i, mod_data in enumerate(outline):
            new_mod = Module(
                course_id=course_id,
                title=mod_data['title'],
                description=mod_data.get('description', ''),
                expected_outcome=mod_data.get('expected_outcome', ''),
                duration=mod_data.get('duration', '1h'),
                locked=i > 0
            )
            db.add(new_mod)
            db.flush() # Get ID
            
            for j, sub_data in enumerate(mod_data.get('sub_topics', [])):
                new_sub = SubTopic(
                    module_id=new_mod.id,
                    title=sub_data['title'],
                    content=sub_data.get('content', 'Content coming soon...'),
                    practice_code=sub_data.get('practice_code', ''),
                    order=j
                )
                db.add(new_sub)
        
        db.commit()
        return True

    @staticmethod
    def get_student_performance(db: Session, course_id: int):
        # Aggregate performance data for tutor view
        # We want to see attempts vs time taken per student/topic
        perf = db.query(
            User.full_name,
            SubTopic.title.label("topic_title"),
            StudentPerformance.attempts,
            StudentPerformance.duration_seconds,
            StudentPerformance.passed
        ).join(User, StudentPerformance.user_id == User.id)\
         .join(SubTopic, StudentPerformance.sub_topic_id == SubTopic.id)\
         .filter(StudentPerformance.course_id == course_id).all()
        
        return [dict(p._mapping) for p in perf]
