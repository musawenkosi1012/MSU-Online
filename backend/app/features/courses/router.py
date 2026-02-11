"""
Courses Feature Router
Course catalog, enrollment, and module management endpoints.
"""
from fastapi import APIRouter, Query, Depends
from typing import Optional, List
from sqlalchemy.orm import Session

from app.core.database import get_db, User
from app.features.auth.service import auth_service
from .service import course_service

router = APIRouter()

@router.get("/")
async def get_courses(
    category: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    format_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(auth_service.get_current_user_optional)
):
    """Get all courses with optional filters and enrollment status."""
    user_id = current_user.id if current_user else None
    return course_service.get_all_courses(category, level, format_type, search, db, user_id)

@router.get("/enrolled")
async def get_enrolled_courses(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get courses the current student is enrolled in."""
    return course_service.get_enrolled_courses(current_user.id, db)

@router.get("/{course_id}")
async def get_course_by_id(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(auth_service.get_current_user_optional)
):
    """Get a specific course by ID."""
    user_id = current_user.id if current_user else None
    course = course_service.get_course_by_id(course_id, db, user_id)
    if not course:
        return {"error": "Course not found"}
    return course

@router.post("/{course_id}/enroll")
async def enroll_in_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Enroll the current user in a course."""
    return course_service.enroll(current_user.id, course_id, db)

@router.get("/{course_id}/repository")
async def get_course_repository(course_id: str):
    """Get the knowledge repository for a course."""
    return course_service.get_repository(course_id)

@router.get("/{course_id}/outline")
async def get_course_outline(course_id: str):
    """Get the structured outline for a course."""
    from app.core.curriculum.loader import curriculum_loader
    outline = curriculum_loader.get_course_outline(course_id)
    if not outline or not outline.get("modules"):
        course = course_service.get_course_by_id(course_id)
        if course:
            return {"course_id": course_id, "title": course.get("title"), "modules": course.get("modules", [])}
        return {"error": "Outline not found"}
    return outline
