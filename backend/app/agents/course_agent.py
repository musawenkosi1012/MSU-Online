from typing import Dict, Any, List
from app.agents.base import BaseAgent
from app.features.courses.service import course_service

class CourseAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="CourseAgent", role="Manages course data, outlines, and enrollment")

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handles course-related operations.
        """
        action = input_data.get("action")
        user_id = input_data.get("user_id")
        course_id = input_data.get("course_id")

        if action == "list_enrolled":
            return {"courses": course_service.get_enrolled_courses(user_id)}
        
        elif action == "get_outline":
            if not course_id:
                return {"error": "course_id required"}
            outline = course_service.get_course_outline(course_id)
            # Pre-process topics for the "Thin Client"
            all_topics = []
            for mod in outline.get("modules", []):
                 if "topics" in mod:
                     all_topics.extend(mod["topics"])
            return {
                "outline": outline,
                "flat_topics": all_topics
            }
        
        elif action == "enroll":
            if not course_id:
                return {"error": "course_id required"}
            success = course_service.enroll_student(user_id, course_id)
            return {"success": success}

        elif action == "list_all":
            category = input_data.get("category")
            search = input_data.get("search")
            courses = course_service.get_all_courses(category=category, search_query=search)
            return {"courses": courses}

        elif action == "get_catalog":
            # Aggregator for catalog metadata
            return {
                "featured": course_service.get_featured_courses(),
                "categories": course_service.get_categories()
            }

        return {"error": f"Invalid action: {action}"}

course_agent = CourseAgent()
