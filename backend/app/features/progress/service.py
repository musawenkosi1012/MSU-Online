"""
Progress Tracking Service (Refactored)
SQLAlchemy-based single source of truth for student progress.
"""
import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from app.core.database import StudentPerformance, SubTopic, Module, SessionLocal, ActivityLog

from app.shared.schemas import TopicIdentifier

class ProgressService:
    def __init__(self):
        pass
    
    def _get_or_create_performance(self, db: Session, user_id: int, topic_id: str, course_id: int = None) -> StudentPerformance:
        """Get or initialize student performance record using TopicIdentifier."""
        # Use TopicIdentifier for robust parsing
        topic_info = TopicIdentifier.from_string(topic_id)
        
        if course_id is None:
            try:
                course_id = int(topic_info.course_id)
            except:
                course_id = 0

        perf = db.query(StudentPerformance).filter_by(
            user_id=user_id,
            topic_id=topic_id
        ).first()

        if not perf:
            # Linking to sub_topic if possible
            sub_topic_id = None
            try:
                sub_topic = db.query(SubTopic).join(Module).filter(
                    Module.course_id == course_id
                ).offset(topic_info.section_index).first()
                if sub_topic:
                    sub_topic_id = sub_topic.id
            except:
                pass

            perf = StudentPerformance(
                user_id=user_id,
                course_id=course_id,
                topic_id=topic_id,
                sub_topic_id=sub_topic_id,
                mastery=0.0,
                attempts=0,
                duration_seconds=0,
                passed=False
            )
            db.add(perf)
            db.commit()
            db.refresh(perf)
            
        return perf

    def update_reading_progress(self, user_id: int, topic_id: str, scroll_depth: float, time_spent: float, min_time: float = 120.0) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            perf = self._get_or_create_performance(db, user_id, topic_id)
            
            # Use JSON-like field names for response compatibility if needed, 
            # but we'll use performance attributes
            depth_score = min(scroll_depth, 1.0)
            time_score = min(time_spent / min_time, 1.0)
            
            # Simple read progress calculation (not explicitly stored in new model, but used for mastery)
            # We'll store it in a metadata or just keep it transient for calculation
            read_progress = round((depth_score * 0.6) + (time_score * 0.4), 2)
            
            # Calculate mastery (Logic from before: mastery = read * 0.4 + exercise * 0.6)
            # Since we don't have separate read_progress column now, let's assume 
            # mastery updates based on the highest reading or exercise score.
            # OR we can add read_progress to the model. Let's add it via property or just logic.
            
            # For now, let's update mastery based on reading if no exercise yet
            if not perf.passed:
                new_mastery = round(read_progress * 0.2, 2)
                if new_mastery > perf.mastery:
                    perf.mastery = new_mastery
            
            perf.duration_seconds += int(time_spent)
            perf.last_attempt = datetime.datetime.utcnow()
            
            db.commit()
            return self._format_response(perf)
        finally:
            db.close()

    def update_exercise_score(self, user_id: int, topic_id: str, score: float) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            perf = self._get_or_create_performance(db, user_id, topic_id)
            
            perf.attempts += 1
            if score >= 80:
                perf.passed = True
            
            # Calculate mastery (New Weighting: 20% Reading, 80% Exercise)
            # mastery = read_progress * 0.2 + (score/100) * 0.8
            # We assume completing the exercise implies 100% reading if it wasn't tracked
            read_component = 0.2 # 100% reading * 0.2
            exercise_component = (score / 100.0) * 0.8
            
            perf.mastery = round(read_component + exercise_component, 2)
            
            perf.last_attempt = datetime.datetime.utcnow()
            db.commit()
            
            return self._format_response(perf)
        finally:
            db.close()

    def check_exercise_unlock(self, user_id: int, topic_id: str) -> bool:
        db = SessionLocal()
        try:
            perf = db.query(StudentPerformance).filter_by(user_id=user_id, topic_id=topic_id).first()
            if not perf:
                return False
            # Needs approx 0.32 mastery (which is 0.8 * 0.4) to unlock exercise
            return perf.mastery >= 0.32
        finally:
            db.close()

    def get_user_progress(self, user_id: int, course_id: Optional[int] = None) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            query = db.query(StudentPerformance).filter_by(user_id=user_id)
            if course_id:
                query = query.filter_by(course_id=course_id)
            
            perfs = query.all()
            return [self._format_response(p) for p in perfs]
        finally:
            db.close()

    def get_course_mastery(self, user_id: int, course_id: int) -> Dict[str, Any]:
        """Aggregate mastery across all topics in a course."""
        db = SessionLocal()
        try:
            # 1. Get all assessable topics (sub_topics) for the course
            # We need to know how many sub_topics exist to weight them equally for MVP
            total_topics_query = db.query(SubTopic).join(Module).filter(Module.course_id == course_id)
            total_count = total_topics_query.count()
            
            if total_count == 0:
                return {"aggregate_mastery": 0.0, "exam_unlocked": False}

            # 2. Get student performance for these topics
            perfs = db.query(StudentPerformance).filter(
                StudentPerformance.user_id == user_id,
                StudentPerformance.course_id == course_id
            ).all()
            
            # Sum masteries
            total_mastery = sum(p.mastery for p in perfs)
            
            # Simple average: aggregate = sum / total_available
            aggregate = round(total_mastery / total_count, 2)
            
            # Threshold for exam unlock: say 70% average mastery?
            # Or just check if they completed all (existing logic)
            exam_unlocked = aggregate >= 0.7
            
            return {
                "aggregate_mastery": aggregate,
                "exam_unlocked": exam_unlocked,
                "topics_tracked": len(perfs),
                "total_topics": total_count
            }
        finally:
            db.close()

    def get_chapter_status(self, user_id: int, course_id: int, total_chapters: int) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            status_list = []
            for i in range(total_chapters):
                # Check for chapter completion (special topic_id or logic)
                # Convention: {course_id}-chapter-{i}
                chapter_topic = f"{course_id}-chapter-{i}"
                perf = db.query(StudentPerformance).filter_by(user_id=user_id, topic_id=chapter_topic).first()
                
                is_completed = perf.passed if perf else False
                
                # Locked if i > 0 and previous chapter not passed
                is_locked = False
                if i > 0:
                    prev_chapter = f"{course_id}-chapter-{i-1}"
                    prev_perf = db.query(StudentPerformance).filter_by(user_id=user_id, topic_id=prev_chapter).first()
                    is_locked = not (prev_perf and prev_perf.passed)
                
                status_list.append({
                    "chapter_index": i,
                    "locked": is_locked,
                    "completed": is_completed
                })
            return status_list
        finally:
            db.close()

    def mark_chapter_complete(self, user_id: int, course_id: int, chapter_index: int):
        db = SessionLocal()
        try:
            chapter_topic = f"{course_id}-chapter-{chapter_index}"
            perf = self._get_or_create_performance(db, user_id, chapter_topic, course_id)
            perf.passed = True
            perf.mastery = 1.0
            db.commit()
        finally:
            db.close()

    def _format_response(self, perf: StudentPerformance) -> Dict[str, Any]:
        """Convert SQLAlchemy model to the expected response format."""
        return {
            "user_id": str(perf.user_id),
            "topic_id": perf.topic_id,
            "read_progress": round(perf.mastery / 0.4, 2) if perf.mastery <= 0.4 else 1.0,
            "exercise_attempted": perf.attempts > 0,
            "exercise_score": 100 if perf.passed else None, # Placeholder if we don't store exact scores
            "mastery": perf.mastery,
            "completed": perf.passed or perf.mastery >= 0.75,
            "last_updated": perf.last_attempt.isoformat()
        }

    # ==========================================
    # ACTIVITY & STREAK LOGIC
    # ==========================================
    def log_activity(self, user_id: int, activity_type: str = "access"):
        db = SessionLocal()
        try:
            last_activity = db.query(ActivityLog).filter(
                ActivityLog.user_id == user_id,
                ActivityLog.activity_type == activity_type
            ).order_by(ActivityLog.timestamp.desc()).first()
            
            should_log = True
            if last_activity:
                time_diff = datetime.datetime.utcnow() - last_activity.timestamp
                if time_diff.total_seconds() < 3600:
                    should_log = False
            
            if should_log:
                new_log = ActivityLog(user_id=user_id, activity_type=activity_type)
                db.add(new_log)
                db.commit()
        finally:
            db.close()

    def get_streak(self, user_id: int) -> int:
        db = SessionLocal()
        try:
            logs = db.query(ActivityLog).filter(
                ActivityLog.user_id == user_id
            ).order_by(ActivityLog.timestamp.desc()).all()
            
            if not logs:
                return 0
                
            activity_dates = sorted(list(set([log.timestamp.date() for log in logs])), reverse=True)
            today = datetime.date.today()
            yesterday = today - datetime.timedelta(days=1)
            
            if activity_dates[0] != today and activity_dates[0] != yesterday:
                return 0
                
            streak = 0
            current_date = activity_dates[0]
            for date in activity_dates:
                if date == current_date:
                    streak += 1
                    current_date -= datetime.timedelta(days=1)
                else: break
            return streak
        finally:
            db.close()

progress_service = ProgressService()
