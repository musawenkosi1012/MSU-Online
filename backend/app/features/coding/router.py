from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from typing import List, Dict
import asyncio

from .models import (
    LessonDefinition, SubmissionRequest, GradingResult
)
from .service import coding_service
from .grading import grade_submission, PythonGrader

router = APIRouter()

@router.get("/lessons", response_model=List[Dict[str, str]])
async def get_coding_lessons(db: Session = Depends(get_db)):
    """List available coding lessons (both pre-defined and generated)."""
    # Use executor for DB/File operations if they might be slow
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: coding_service.list_lessons(db))

@router.get("/lessons/{lesson_id}", response_model=LessonDefinition)
async def get_lesson(lesson_id: str, db: Session = Depends(get_db)):
    """Get a lesson by ID. Generates it if it doesn't exist (AI)."""
    loop = asyncio.get_event_loop()
    try:
        # This will trigger AI generation if lesson is missing
        lesson = await loop.run_in_executor(None, lambda: coding_service.get_lesson(lesson_id, db))
        return lesson
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load or generate lesson: {str(e)}")

@router.post("/submit", response_model=GradingResult)
async def submit_code(request: SubmissionRequest, db: Session = Depends(get_db)):
    """Submit code for grading and get AI feedback."""
    loop = asyncio.get_event_loop()
    
    # 1. Get Lesson
    lesson = await loop.run_in_executor(None, lambda: coding_service.get_lesson(request.lesson_id, db))
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # 2. Grade (CPU bound)
    result = await loop.run_in_executor(None, lambda: grade_submission(lesson, request.code, request.inputs))
    
    # 3. Generate Feedback (AI bound)
    # Only generate feedback if score < 100 or if explicitly requested (optimization: always for now)
    feedback = await loop.run_in_executor(None, lambda: coding_service.generate_feedback(lesson, request.code, result))
    
    # Append feedback to message for frontend visibility
    if feedback:
        result.message += f"\n\n**Tutor Feedback:**\n{feedback}"
    
    return result

@router.post("/run", response_model=GradingResult)
async def run_code(request: SubmissionRequest, db: Session = Depends(get_db)):
    """Run code without full structural grading."""
    loop = asyncio.get_event_loop()
    
    lesson = await loop.run_in_executor(None, lambda: coding_service.get_lesson(request.lesson_id, db))
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Skip structural check for 'run', just run tests
    result = await loop.run_in_executor(None, lambda: PythonGrader.run_tests(request.code, lesson.spec, request.inputs))
    return result
