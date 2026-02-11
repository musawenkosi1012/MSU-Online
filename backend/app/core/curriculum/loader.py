"""
Curriculum Loader
Loads and manages course outlines and learning objectives.
"""
import os
import json
from typing import Dict, Any, List, Optional

from app.features.courses.service import course_service


class CurriculumLoader:
    """Loads and caches curriculum data."""
    
    def __init__(self):
        self.courses_cache: Dict[str, Dict[str, Any]] = {}
        self.topics_index: Dict[str, Dict[str, Any]] = {}  # topic_id -> topic data
        self.modules_index: Dict[str, Dict[str, Any]] = {}  # module_id -> module data
    
    def load_all_courses(self) -> List[Dict[str, Any]]:
        """Load all courses into cache."""
        courses = course_service.get_all_courses()
        
        for course in courses:
            self._cache_course(course)
        
        return courses
    
    def _cache_course(self, course: Dict[str, Any]):
        """Cache a course and build topic/module indices."""
        course_id = course.get("id")
        if not course_id:
            return
        
        self.courses_cache[course_id] = course
        
        for module in course.get("modules", []):
            module_id = module.get("id")
            if module_id:
                self.modules_index[module_id] = {
                    **module,
                    "course_id": course_id,
                    "course_title": course.get("title")
                }
            
            for topic in module.get("topics", []):
                topic_id = topic.get("id")
                if topic_id:
                    self.topics_index[topic_id] = {
                        **topic,
                        "module_id": module_id,
                        "module_title": module.get("title"),
                        "course_id": course_id,
                        "course_title": course.get("title")
                    }
    
    def get_course(self, course_id: str) -> Optional[Dict[str, Any]]:
        """Get course by ID."""
        if course_id not in self.courses_cache:
            course = course_service.get_course_by_id(course_id)
            if course:
                self._cache_course(course)
        return self.courses_cache.get(course_id)
    
    def get_topic(self, topic_id: str) -> Optional[Dict[str, Any]]:
        """Get topic by ID with full context."""
        return self.topics_index.get(topic_id)
    
    def get_module(self, module_id: str) -> Optional[Dict[str, Any]]:
        """Get module by ID with full context."""
        return self.modules_index.get(module_id)
    
    def get_learning_objectives(self, topic_id: str) -> List[str]:
        """Get learning objectives for a topic."""
        topic = self.get_topic(topic_id)
        if topic:
            return topic.get("learning_outcomes", [])
        return []
    
    def get_topic_prerequisites(self, topic_id: str) -> List[str]:
        """Get prerequisite topic IDs for a topic."""
        topic = self.get_topic(topic_id)
        if topic:
            return topic.get("prerequisites", [])
        return []
    
    def get_course_outline(self, course_id: str) -> Dict[str, Any]:
        """Get structured course outline."""
        course = self.get_course(course_id)
        if not course:
            return {}
        
        outline = {
            "course_id": course_id,
            "title": course.get("title"),
            "description": course.get("description"),
            "modules": []
        }
        
        for module in course.get("modules", []):
            module_outline = {
                "id": module.get("id"),
                "title": module.get("title"),
                "topics": [
                    {
                        "topic_id": t.get("id") or t.get("topic_id"),
                        "title": t.get("title"),
                        "type": t.get("type", "content"),
                        "learning_outcomes": t.get("learning_outcomes", [])
                    }
                    for t in (module.get("topics") or module.get("lessons") or [])
                ]
            }
            outline["modules"].append(module_outline)
        
        return outline
    
    def get_all_topics_flat(self, course_id: str = None) -> List[Dict[str, Any]]:
        """Get flat list of all topics, optionally filtered by course."""
        if course_id:
            return [t for t in self.topics_index.values() if t.get("course_id") == course_id]
        return list(self.topics_index.values())
    
    def search_topics(self, query: str) -> List[Dict[str, Any]]:
        """Search topics by title or learning outcomes."""
        query_lower = query.lower()
        results = []
        
        for topic in self.topics_index.values():
            title = topic.get("title", "").lower()
            outcomes = " ".join(topic.get("learning_outcomes", [])).lower()
            
            if query_lower in title or query_lower in outcomes:
                results.append(topic)
        
        return results


# Singleton instance
curriculum_loader = CurriculumLoader()
