from typing import Dict, Any, List
from app.agents.base import BaseAgent
from app.features.progress.service import progress_service
from app.features.assessment.service import assessment_service
from app.features.courses.service import course_service
from app.features.ai_tutor.service import ai_tutor_service

class DashboardAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="DashboardAgent", role="Aggregates and processes all data for the student dashboard")

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Returns a complete state for the Student Dashboard.
        All processing is done here.
        """
        user_id = input_data.get("user_id")
        
        # 1. Fetch GPA & Assessment Data
        gpa_data = assessment_service.calculate_gpa(user_id)
        breakdown = assessment_service.get_gpa_breakdown(user_id)
        scale = assessment_service.get_grading_scale()
        
        # 2. Fetch Progress & Mastery
        mastery_stats = progress_service.get_aggregate_mastery(user_id)
        streak = progress_service.get_user_streak(user_id)
        
        # 3. Fetch Enrolled Courses
        enrolled = course_service.get_enrolled_courses(user_id)
        
        # 4. Fetch Next Topic Recommendation (via AI)
        next_topic = {}
        rag_stats = {}
        if enrolled:
            try:
                next_topic = ai_tutor_service.get_next_topic_recommendation(user_id, enrolled[0].get("id"))
                rag_stats = ai_tutor_service.get_rag_stats()
            except:
                next_topic = {"recommendation": "Maintain consistency for optimal results."}

        # 5. Processing (Moving logic from frontend to here)
        processed_mastery = round((mastery_stats.get("aggregate_mastery") or 0) * 100)
        
        return {
            "gpa": gpa_data,
            "breakdown": breakdown,
            "scale": scale,
            "mastery": processed_mastery,
            "streak": streak,
            "enrolled_courses": enrolled,
            "next_topic": next_topic,
            "rag_stats": rag_stats,
            "model_status": {"loaded": True, "loading": False}
        }

dashboard_agent = DashboardAgent()
