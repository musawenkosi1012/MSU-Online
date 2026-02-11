import json
import os

STORAGE_FILE = "user_data.json"

class PersistenceService:
    def __init__(self):
        if not os.path.exists(STORAGE_FILE):
            with open(STORAGE_FILE, 'w') as f:
                json.dump({"notes": "", "outline": ""}, f)

    def save_notes(self, notes: str):
        data = self.load_all()
        data["notes"] = notes
        with open(STORAGE_FILE, 'w') as f:
            json.dump(data, f)

    def load_all(self):
        try:
            with open(STORAGE_FILE, 'r') as f:
                return json.load(f)
        except Exception:
            return {"notes": "", "outline": ""}

persistence_service = PersistenceService()
