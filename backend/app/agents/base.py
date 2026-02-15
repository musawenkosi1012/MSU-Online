from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import json
from app.shared.model_service import model_service

class BaseAgent(ABC):
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role
        self.model_service = model_service

    @abstractmethod
    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent's core logic."""
        pass

    def _generate_response(self, prompt: str, max_tokens: int = 1000) -> str:
        """Helper to call the LLM."""
        return self.model_service.generate_response(prompt, max_tokens)

    def _parse_json(self, text: str) -> Dict[str, Any]:
        """Extract and parse JSON from LLM response."""
        try:
            # Find JSON block
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end != -1:
                return json.loads(text[start:end])
            return {"error": "No JSON found in response", "raw": text}
        except Exception as e:
            return {"error": str(e), "raw": text}
