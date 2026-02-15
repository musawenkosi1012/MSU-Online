from typing import Dict, Any, List
from app.agents.base import BaseAgent
from app.agents.storage_agent import storage_agent
from app.agents.intelligence_agent import intelligence_agent
from app.agents.dashboard_agent import dashboard_agent
from app.agents.course_agent import course_agent
from app.agents.research_agent import research_agent

class CoordinatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Coordinator", role="Orchestrates multi-agent workflows")
        self.agents: Dict[str, BaseAgent] = {
            "storage": storage_agent,
            "intelligence": intelligence_agent,
            "dashboard": dashboard_agent,
            "course": course_agent,
            "research": research_agent
        }

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Determines which agent should handle the request and executes the workflow.
        """
        # DETERMINISTIC ROUTING (Fast Path)
        # If the client explicitly requests an agent, skip intent analysis
        explicit_agent = input_data.get("agent")
        if explicit_agent in self.agents:
            return await self.agents[explicit_agent].run(input_data)

        # 1. Intent Analysis (AI Path)
        query = input_data.get("query", input_data.get("message", ""))
        intent_prompt = f"""
        You are the MSUNexus Coordinator. Route to the correct agent.
        Agents:
        - intelligence: For questions, reasoning, and tutor chat.
        - research: For web scraping, articles, and deep essays.
        - storage: For notes and private data.
        - dashboard: Only for full student state updates.
        
        Input: {query if query else str(input_data)}
        
        Return JSON: {{"agent": "agent_key", "reasoning": "..."}}
        """
        
        intent_raw = self._generate_response(intent_prompt, max_tokens=100)
        intent_data = self._parse_json(intent_raw)
        
        agent_key = intent_data.get("agent", "intelligence")
        
        if agent_key in self.agents:
            return await self.agents[agent_key].run(input_data)
        
        return await self.agents["intelligence"].run(input_data)

coordinator = CoordinatorAgent()
