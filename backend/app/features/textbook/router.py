"""
Textbook Feature Router
Electronic textbook generation and content endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from .service import textbook_service
from .models import UpdateStructureRequest, GenerateQuizRequest
from app.features.auth.service import auth_service
from app.features.progress.service import progress_service
from app.core.database import User

router = APIRouter()


class GenerateTextbookRequest(BaseModel):
    course_id: str
    force_regenerate: bool = False


@router.get("/{course_id}")
async def get_textbook(
    course_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get textbook content for a course."""
    return textbook_service.get_textbook(course_id)


@router.post("/generate")
async def generate_textbook(
    data: GenerateTextbookRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Generate or regenerate textbook content."""
    return await textbook_service.generate_textbook(data.course_id, data.force_regenerate, user_id=current_user.id)


@router.put("/{course_id}/structure")
async def update_structure(
    course_id: str,
    data: UpdateStructureRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Update textbook structure (Tutor Editor)."""
    # Convert Pydantic models to dict for service
    structure_dict = data.dict()
    return await textbook_service.update_structure(course_id, structure_dict)


@router.post("/quiz/generate")
async def generate_quiz(
    data: GenerateQuizRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Generate a quiz for a section."""
    return textbook_service.generate_quiz(data.section_content)


class GenerateFinalExamRequest(BaseModel):
    course_id: str


@router.post("/quiz/generate-final")
async def generate_final_exam_endpoint(
    data: GenerateFinalExamRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Generate a comprehensive final exam."""
    # Gating Check
    mastery_report = progress_service.get_course_mastery(str(current_user.id), data.course_id, {}) # Weights handled internally or passed
    if not mastery_report.get("exam_unlocked", False):
        raise HTTPException(status_code=403, detail="First finish a course to undergo an exam. Minimum 70% mastery required.")

    textbook = textbook_service.get_textbook(data.course_id)
    if not textbook:
        raise HTTPException(status_code=404, detail="Textbook not found")
        
    return textbook_service.generate_final_exam(
        data.course_id,
        textbook.get("title", "Course"),
        textbook
    )


class GenerateChapterQuizRequest(BaseModel):
    course_id: str
    chapter_index: int
    chapter_title: str
    chapter_content: str


@router.post("/quiz/generate-chapter")
async def generate_chapter_assessment(
    data: GenerateChapterQuizRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Generate a full chapter assessment (10 MCQs + 2 Open-Ended)."""
    return textbook_service.generate_chapter_assessment(
        data.course_id, 
        data.chapter_index, 
        data.chapter_title, 
        data.chapter_content,
        user_id=str(current_user.id)
    )


@router.get("/{course_id}/chapter/{chapter_id}")
async def get_chapter(
    course_id: str,
    chapter_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get specific chapter content."""
    return textbook_service.get_chapter(course_id, chapter_id)
