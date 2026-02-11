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

    def get_notes(self, user_id: str) -> str:
        """Get notes from DB."""
        from app.core.database import SessionLocal, Note
        db = SessionLocal()
        try:
            note = db.query(Note).filter(Note.user_id == user_id).first()
            if note:
                return note.content
            return ""
        finally:
            db.close()

    def save_notes(self, user_id: str, notes: str):
        """Save notes to database."""
        from app.core.database import SessionLocal, Note
        db = SessionLocal()
        try:
            note = db.query(Note).filter(Note.user_id == user_id).first()
            if note:
                note.content = notes
                note.updated_at = datetime.datetime.utcnow()
            else:
                new_note = Note(user_id=user_id, content=notes, title="Main Notebook")
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
