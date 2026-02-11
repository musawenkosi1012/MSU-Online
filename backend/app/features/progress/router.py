"""
Progress Feature Router
Reading progress and mastery tracking endpoints.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from .service import progress_service
from app.features.auth.service import auth_service
from app.core.database import User

router = APIRouter()


class ReadingProgressRequest(BaseModel):
    scroll_depth: float
    time_spent: float
    min_time: Optional[float] = 300.0


class ExerciseScoreRequest(BaseModel):
    topic_id: str
    score: float


@router.post("/topics/{topic_id}/progress")
async def update_topic_progress(
    topic_id: str,
    data: ReadingProgressRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Update progress for a topic (Used by TopicTile)."""
    result = progress_service.update_reading_progress(
        current_user.id,
        topic_id,
        data.scroll_depth,
        data.time_spent,
        data.min_time
    )
    # Inject unlock status for frontend immediate feedback
    result["exercise_unlocked"] = progress_service.check_exercise_unlock(current_user.id, topic_id)
    return result


@router.post("/reading")
async def update_reading_progress(
    data: ReadingProgressRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Legacy support for /reading endpoint."""
    # Note: This endpoint is missing topic_id in current ReadingProgressRequest but was defined
    # We'll allow it if topic_id is provided in the body or handle via the new path
    return {"message": "Please use /topics/{topic_id}/progress"}


@router.get("/unlock/{topic_id}")
async def check_exercise_unlock(
    topic_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Check if exercise is unlocked for a topic."""
    unlocked = progress_service.check_exercise_unlock(str(current_user.id), topic_id)
    return {"unlocked": unlocked}


@router.post("/exercise")
async def update_exercise_score(
    data: ExerciseScoreRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Update exercise score for a topic."""
    return progress_service.update_exercise_score(
        str(current_user.id),
        data.topic_id,
        data.score
    )


@router.get("/")
async def get_user_progress(
    course_id: Optional[str] = None,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get all progress for current user."""
    return progress_service.get_user_progress(str(current_user.id), course_id)


@router.get("/course/{course_id}/mastery")
async def get_course_mastery(
    course_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get aggregate course mastery."""
    c_id = int(course_id) if str(course_id).isdigit() else 1
    return progress_service.get_course_mastery(current_user.id, c_id)
@router.post("/activity")
async def log_activity(
    activity_type: str = "access",
    current_user: User = Depends(auth_service.get_current_user)
):
    """Log current user activity."""
    return progress_service.log_activity(current_user.id, activity_type)


@router.get("/streak")
async def get_streak(
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get current user streak."""
    return {"streak": progress_service.get_streak(current_user.id)}


@router.get("/course/{course_id}/chapters")
async def get_course_chapters_status(
    course_id: str,
    total_chapters: int,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get status (locked/unlocked) for all chapters."""
    return progress_service.get_chapter_status(str(current_user.id), course_id, total_chapters)
