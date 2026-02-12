import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
import datetime

class PersistenceService:
    def __init__(self, storage_dir: str = "data/notebooks"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def _get_user_path(self, user_id: str) -> Path:
        return self.storage_dir / f"notes_{user_id}.json"

    def get_notes(self, user_id: str, course_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get all notes from DB as objects."""
        from app.core.database import SessionLocal, Note
        db = SessionLocal()
        try:
            query = db.query(Note).filter(Note.user_id == user_id)
            if course_id:
                query = query.filter(Note.course_id == course_id)
            
            notes = query.order_by(Note.updated_at.desc()).all()
            return [
                {
                    "id": n.id,
                    "title": n.title,
                    "content": n.content,
                    "course_id": n.course_id,
                    "updated_at": n.updated_at.isoformat()
                } for n in notes
            ]
        finally:
            db.close()

    def save_notes(self, user_id: str, notes: str, course_id: Optional[int] = None, title: Optional[str] = None):
        """Save/Update a note."""
        from app.core.database import SessionLocal, Note
        db = SessionLocal()
        try:
            # If title is provided, try to find by title. Otherwise find the course/main note.
            query = db.query(Note).filter(Note.user_id == user_id)
            if title:
                query = query.filter(Note.title == title)
            elif course_id:
                query = query.filter(Note.course_id == course_id)
            else:
                query = query.filter(Note.course_id == None, Note.title == "Main Notebook")
                
            note = query.first()
            if note:
                note.content = notes
                if title: note.title = title
                note.updated_at = datetime.datetime.utcnow()
            else:
                new_note = Note(
                    user_id=user_id, 
                    course_id=course_id,
                    content=notes, 
                    title=title or (f"Notes for Course {course_id}" if course_id else "Main Notebook")
                )
                db.add(new_note)
            db.commit()
        finally:
            db.close()

    def delete_notes(self, user_id: str):
        from app.core.database import SessionLocal, Note
        db = SessionLocal()
        try:
            db.query(Note).filter(Note.user_id == user_id).delete()
            db.commit()
        finally:
            db.close()
        
        path = self._get_user_path(user_id)
        if path.exists():
            path.unlink()

persistence_service = PersistenceService()
