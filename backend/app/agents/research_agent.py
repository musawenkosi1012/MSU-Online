from typing import Dict, Any, List
from app.agents.base import BaseAgent
from app.features.research.service import research_service

class ResearchAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="ResearchAgent", role="Performs deep web research and manages research history")

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handles research-related operations.
        """
        action = input_data.get("action")
        query = input_data.get("query")
        user_id = input_data.get("user_id")

        if action == "scrape":
            # Direct proxy to existing service logic
            results = research_service.scrape_web(query)
            return {"results": results}
        
        elif action == "deep_essay":
            # Logic for long-form essay generation
            # Note: We reuse the existing service logic but wrap it in the agent response
            essay = research_service.generate_deep_essay(query, user_id=user_id)
            return essay
        
        elif action == "get_cache":
            cache = research_service.get_user_cache(user_id)
            return {"cache": cache}
        
        elif action == "clear_cache":
            research_service.clear_user_cache(user_id)
            return {"status": "cleared"}

        return {"error": f"Invalid action: {action}"}

research_agent = ResearchAgent()
