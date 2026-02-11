from fastapi import APIRouter, Depends, HTTPException, Body
import datetime
from sqlalchemy.orm import Session
from app.core.database import get_db, User
from app.features.auth.service import auth_service
from app.features.tutor.service import TutorService
from pydantic import BaseModel
from typing import List, Optional

from app.features.research.scraper import AdvancedScraper

router = APIRouter()
scraper = AdvancedScraper()

@router.get("/search")
async def global_search(q: str):
    """Global search for course materials and research."""
    results = await scraper.search(q, max_results=5)
    return {"results": results}

class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    total_hours: Optional[int] = 10
    is_programming: Optional[bool] = False

class SubTopicUpdate(BaseModel):
    title: str
    content: Optional[str] = ""
    practice_code: Optional[str] = ""

class ModuleUpdate(BaseModel):
    title: str
    description: Optional[str] = ""
    expected_outcome: Optional[str] = ""
    duration: Optional[str] = "1h"
    sub_topics: List[SubTopicUpdate]

@router.get("/stats")
async def get_tutor_stats(db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    if current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Tutor access only.")
    return TutorService.get_dashboard_stats(db)

@router.get("/review")
async def get_review_queue(db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    if current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Tutor access only.")
    return {"articles": TutorService.get_review_queue(db)}

@router.get("/articles")
async def get_verified_articles(db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    if current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Tutor access only.")
    return {"articles": TutorService.get_recently_verified(db)}

@router.get("/my-courses")
async def get_tutor_courses(db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    if current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Tutor access only.")
    return TutorService.get_tutor_courses(db, current_user.id)

@router.post("/courses")
async def create_course(course: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    if current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Tutor access only.")
    return TutorService.create_course(db, current_user.id, course.dict())

@router.post("/courses/{course_id}/outline")
async def update_course_outline(course_id: int, outline: List[ModuleUpdate], db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    if current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Tutor access only.")
    # In full app, we'd check if current_user owns this course
    success = TutorService.update_course_outline(db, course_id, [m.dict() for m in outline])
    return {"status": "success" if success else "error"}

@router.get("/courses/{course_id}/performance")
async def get_course_performance(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    if current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Tutor access only.")
    return TutorService.get_student_performance(db, course_id)

@router.post("/approve/{content_id}")
async def approve_content(content_id: int, db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    if current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Tutor access only.")
    
    from app.core.database import GeneratedContent
    content = db.query(GeneratedContent).filter(GeneratedContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    content.status = "approved"
    content.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Content approved"}

@router.post("/reject/{content_id}")
async def reject_content(content_id: int, db: Session = Depends(get_db), current_user: User = Depends(auth_service.get_current_user)):
    if current_user.role != "tutor":
        raise HTTPException(status_code=403, detail="Tutor access only.")
    
    from app.core.database import GeneratedContent
    content = db.query(GeneratedContent).filter(GeneratedContent.id == content_id).first()
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    content.status = "rejected"
    content.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Content rejected"}
