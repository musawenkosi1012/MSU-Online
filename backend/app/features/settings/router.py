
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.core.database import get_db, User
from app.features.auth.service import auth_service
from .service import settings_service

router = APIRouter()

@router.get("/")
async def get_settings(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all accessible settings for the current user."""
    settings = settings_service.get_user_settings(db, current_user.id)
    
    # Structure for frontend
    return {
        "account_identity": settings.account_identity,
        "security_access": settings.security_access,
        "privacy_sharing": settings.privacy_sharing,
        "notifications": settings.notifications,
        "learning_preferences": settings.learning_preferences if current_user.role == "student" else None,
        "teaching_controls": settings.teaching_controls if current_user.role == "tutor" else None,
        "skill_evaluation": settings.skill_evaluation,
        "billing_monetization": settings.billing_monetization,
        "integrations_api": settings.integrations_api,
        "system_institutional": settings.system_institutional if current_user.role == "admin" else None,
        "role": current_user.role
    }

@router.patch("/{section}")
async def update_settings_section(
    section: str,
    data: Dict[str, Any],
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific settings section."""
    allowed_sections = [
        "account_identity", "security_access", "privacy_sharing",
        "notifications", "learning_preferences", "teaching_controls",
        "skill_evaluation", "billing_monetization", "integrations_api",
        "system_institutional"
    ]
    
    if section not in allowed_sections:
        raise HTTPException(status_code=400, detail="Invalid settings section.")
        
    result = settings_service.update_settings(db, current_user, section, data)
    
    if "error" in result:
        raise HTTPException(status_code=403, detail=result["error"])
        
    return result
