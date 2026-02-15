from typing import Dict, Any
from app.agents.base import BaseAgent
from app.shared.model_service import model_service

class IntelligenceAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="IntelligenceAgent", role="Processes complex queries and performs reasoning")

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Performs high-level intelligence tasks.
        """
        query = input_data.get("query") or input_data.get("message")
        context = input_data.get("context", {})
        mode = input_data.get("mode", "chat")
        
        if mode == "interactive":
             # Use tutoring service directly within the agentic flow
             from app.features.ai_tutor.service import ai_tutor_service
             return ai_tutor_service.handle_interactive_session(
                 user_id=input_data.get("user_id"),
                 course_id=input_data.get("course_id"),
                 topic_id=input_data.get("topic_id"),
                 message=query,
                 session_id=input_data.get("session_id"),
                 action=input_data.get("action")
             )

        # Standard AI generation (reasoning enabled)
        return self.model_service.generate_with_reasoning(
            query=query,
            course_id=input_data.get("course_id") or context.get("course_id"),
            session_id=input_data.get("session_id"),
            allow_web_scrape=input_data.get("allow_web_scrape", False)
        )

intelligence_agent = IntelligenceAgent()
