
import json
import datetime
from sqlalchemy.orm import Session
from app.core.database import User, UserSettings

class SettingsService:
    def get_user_settings(self, db: Session, user_id: int):
        settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
        if not settings:
            # Initialize default settings
            settings = UserSettings(user_id=user_id)
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings

    def update_settings(self, db: Session, user: User, section: str, data: dict):
        """
        Update a specific section of user settings with role-based enforcement.
        """
        # 1. Role Validation (Enforce user rules)
        if section == "learning_preferences" and user.role != "student":
            return {"error": "Learning Preferences are for students only."}
        if section == "teaching_controls" and user.role != "tutor":
            return {"error": "Teaching Controls are for tutors only."}
        if section == "system_institutional" and user.role != "admin":
            return {"error": "System Institutional settings are for admins only."}
        
        # 2. Field-level permission checks (Business logic)
        # For Skill Settings: Students are read-only
        if section == "skill_evaluation" and user.role == "student":
            return {"error": "Skill settings are read-only for students."}

        # 3. Fetch/Create Section
        settings = self.get_user_settings(db, user.id)
        
        # 4. Partial Update (PATCH Logic)
        current_val = getattr(settings, section)
        if current_val:
            try:
                current_dict = json.loads(current_val)
            except:
                current_dict = {}
        else:
            current_dict = {}
            
        current_dict.update(data)
        setattr(settings, section, json.dumps(current_dict))
        
        # Audit Log (Implicitly handled by updated_at, but we could add a log entry)
        db.commit()
        db.refresh(settings)
        
        return {"status": "success", "updated_section": section}

settings_service = SettingsService()
