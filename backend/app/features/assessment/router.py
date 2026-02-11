"""
Assessment Feature Router
Quiz, exercise, and exam endpoints with robust security and validation.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import logging
import asyncio

from .service import assessment_service
from .gpa_engine import gpa_service
from app.features.auth.service import auth_service
from app.core.database import User, get_db

router = APIRouter()
logger = logging.getLogger(__name__)

# ============================================
# SCHEMAS & VALIDATION
# ============================================

class QuestionRequest(BaseModel):
    course_id: str = Field(..., min_length=1, max_length=50)
    question_type: str = Field("mcq", pattern="^(mcq|open_ended|code)$")
    difficulty: str = Field("medium", pattern="^(easy|medium|hard)$")
    count: int = Field(5, ge=1, le=20)

class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer: str = Field(..., min_length=1, max_length=5000)
    question_type: str = Field("mcq", pattern="^(mcq|open_ended|code)$")

    @validator('answer')
    def sanitize_answer(cls, v):
        # Basic sanitization (strip potential HTML tags if strictly text)
        import re
        return re.sub(r'<[^>]*>', '', v)

class EssaySubmitRequest(BaseModel):
    topic: str = Field(..., min_length=5, max_length=200)
    essay_text: str = Field(..., min_length=50, max_length=20000)
    topic_id: Optional[str] = None

class AssessmentSubmissionRequest(BaseModel):
    answers: List[Dict[str, Any]] = Field(..., min_items=1, description="List of answer objects")

# ============================================
# ENDPOINTS
# ============================================

@router.get("/questions/{course_id}")
async def get_questions(
    course_id: str = Path(..., min_length=1, max_length=50),
    question_type: str = Query("mcq", pattern="^(mcq|open_ended|code)$"),
    difficulty: str = Query("medium", pattern="^(easy|medium|hard)$"),
    count: int = Query(5, ge=1, le=20),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get quiz questions for a course."""
    try:
        # Use to_thread for potentially blocking service calls if they are sync
        return await asyncio.to_thread(
            assessment_service.get_questions,
            course_id, question_type, difficulty, count
        )
    except Exception as e:
        logger.error(f"Error fetching questions: {e}")
        raise HTTPException(status_code=500, detail="Failed to load questions")

@router.post("/submit")
async def submit_answer(
    data: SubmitAnswerRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Submit a single answer for grading."""
    # Rate limiting could be applied here
    try:
        result = await asyncio.to_thread(
            assessment_service.grade_answer,
            data.question_id, data.answer, data.question_type
        )
        return result
    except Exception as e:
        logger.error(f"Grading error: {e}")
        raise HTTPException(status_code=500, detail="Grading failed")

@router.post("/essay")
async def submit_essay(
    data: EssaySubmitRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Submit an essay for AI grading (heavy operation)."""
    try:
        # AI grading is heavy, definitely run in thread
        result = await asyncio.to_thread(
            assessment_service.grade_essay,
            data.topic, data.essay_text
        )
        # Log submission for audit
        logger.info(f"User {current_user.id} submitted essay on '{data.topic}'")
        return result
    except Exception as e:
        logger.error(f"Essay grading error: {e}")
        raise HTTPException(status_code=500, detail="Essay evaluation failed")

@router.get("/gpa")
def get_gpa(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's GPA (Sync for DB safety)."""
    return gpa_service.get_gpa(db, current_user.id)

@router.get("/gpa/breakdown")
def get_gpa_breakdown(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed GPA breakdown (Sync for DB safety)."""
    return gpa_service.get_gpa_breakdown(db, current_user.id)

@router.get("/gpa/scale")
def get_gpa_scale():
    """Get the grade point scale."""
    return gpa_service.get_grade_scale()

@router.get("/topics/{course_id}")
async def get_assessment_topics(
    course_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get assessment topics/exercises for a course."""
    try:
        topics = await asyncio.to_thread(assessment_service.get_course_assessments, course_id)
        return {"topics": topics}
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Course {course_id} not found")

@router.get("/results/{student_id}")
async def get_student_results(
    student_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get submission results for a student (Tutor/Self only)."""
    # Permission Check
    if str(current_user.id) != student_id and current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Access denied")
        
    results = await asyncio.to_thread(assessment_service.get_student_results, student_id)
    return {"results": results}

@router.get("/assessment/{assessment_id}")
async def get_assessment(
    assessment_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get specific assessment."""
    assessment = await asyncio.to_thread(assessment_service.get_assessment, assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment

@router.post("/assessment/{assessment_id}/submit")
async def submit_assessment(
    assessment_id: str,
    data: AssessmentSubmissionRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Submit full assessment."""
    try:
        return await asyncio.to_thread(
            assessment_service.submit,
            current_user.id, assessment_id, data.answers
        )
    except Exception as e:
        logger.error(f"Assessment submission error: {e}")
        raise HTTPException(status_code=500, detail="Submission processing failed")

@router.get("/status/{course_id}")
async def get_course_status(
    course_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Check if student has completed all exercises."""
    return await asyncio.to_thread(
        assessment_service.check_course_completion,
        current_user.id, course_id
    )

@router.post("/final-exam/{course_id}")
async def get_final_exam(
    course_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get or generate final exam if unlocked."""
    status_data = await asyncio.to_thread(
        assessment_service.check_course_completion,
        current_user.id, course_id
    )
    
    if not status_data or not status_data.get("completed"):
        raise HTTPException(status_code=403, detail="Complete all exercises first to unlock final exam.")
    
    try:
        exam = await asyncio.to_thread(assessment_service.get_or_create_final_exam, course_id)
        if not exam:
            raise HTTPException(status_code=500, detail="Failed to generate exam")
        logger.info(f"Final exam generated/retrieved for course {course_id} by user {current_user.id}")
        return exam
    except Exception as e:
        logger.error(f"Final exam generation error: {e}")
        raise HTTPException(status_code=500, detail="Exam generation failed")
