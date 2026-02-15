from typing import Dict, Any, List
import os
import json
from app.agents.base import BaseAgent

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")

class StorageAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="StorageAgent", role="Manages persistent data storage and retrieval")
        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handles storage operations: 'save', 'fetch', 'list'.
        """
        action = input_data.get("action")
        collection = input_data.get("collection", "general")
        data = input_data.get("data")
        item_id = input_data.get("id")

        if action == "save":
            return self._save(collection, item_id, data)
        elif action == "fetch":
            return self._fetch(collection, item_id)
        elif action == "list":
            return self._list(collection)
        else:
            return {"error": f"Unsupported action: {action}"}

    def _get_path(self, collection: str, item_id: str = None) -> str:
        col_dir = os.path.join(DATA_DIR, collection)
        if not os.path.exists(col_dir):
            os.makedirs(col_dir)
        if item_id:
            return os.path.join(col_dir, f"{item_id}.json")
        return col_dir

    def _save(self, collection: str, item_id: str, data: Any) -> Dict[str, Any]:
        path = self._get_path(collection, item_id)
        try:
            with open(path, 'w') as f:
                json.dump(data, f, indent=4)
            return {"status": "success", "path": path}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def _fetch(self, collection: str, item_id: str) -> Dict[str, Any]:
        path = self._get_path(collection, item_id)
        if not os.path.exists(path):
            return {"status": "error", "message": "Not found"}
        try:
            with open(path, 'r') as f:
                return {"status": "success", "data": json.load(f)}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def _list(self, collection: str) -> Dict[str, Any]:
        path = self._get_path(collection)
        try:
            items = [f.replace(".json", "") for f in os.listdir(path) if f.endswith(".json")]
            return {"status": "success", "items": items}
        except Exception as e:
            return {"status": "error", "message": str(e)}

storage_agent = StorageAgent()
