"""
Curriculum Linker
Links topics to exercises, mastery tracking, and GPA updates.
"""
from typing import Dict, Any, List, Optional

from .loader import curriculum_loader


class CurriculumLinker:
    """Links curriculum elements to learning activities."""
    
    def __init__(self):
        # Default weights for topic types
        self.weights = {
            "reading": 0.3,
            "exercise": 0.5,
            "quiz": 0.2
        }
    
    def get_topic_activities(self, topic_id: str) -> Dict[str, Any]:
        """
        Get all activities linked to a topic.
        
        Returns:
            Dict with reading, exercises, quizzes, etc.
        """
        topic = curriculum_loader.get_topic(topic_id)
        if not topic:
            return {"error": "Topic not found"}
        
        return {
            "topic_id": topic_id,
            "topic_title": topic.get("title"),
            "learning_outcomes": topic.get("learning_outcomes", []),
            "activities": {
                "reading": {
                    "type": "reading",
                    "weight": self.weights["reading"],
                    "duration_minutes": topic.get("reading_time", 15)
                },
                "exercise": {
                    "type": "exercise",
                    "weight": self.weights["exercise"],
                    "question_count": topic.get("exercise_count", 5)
                },
                "quiz": {
                    "type": "quiz",
                    "weight": self.weights["quiz"],
                    "question_count": topic.get("quiz_count", 3)
                }
            },
            "unlock_threshold": topic.get("unlock_threshold", 0.8),
            "mastery_formula": "reading*0.3 + exercise*0.5 + quiz*0.2"
        }
    
    def calculate_topic_mastery(self, reading_score: float, 
                                 exercise_score: float, 
                                 quiz_score: float,
                                 hints_penalty: float = 0.0) -> float:
        """
        Calculate mastery score for a topic.
        
        Args:
            reading_score: 0-1 reading completion
            exercise_score: 0-1 exercise performance
            quiz_score: 0-1 quiz performance
            hints_penalty: Penalty for hints used (0-1)
        
        Returns:
            Mastery score 0-1
        """
        raw_mastery = (
            reading_score * self.weights["reading"] +
            exercise_score * self.weights["exercise"] +
            quiz_score * self.weights["quiz"]
        )
        
        # Apply hints penalty
        final_mastery = max(0.0, raw_mastery - hints_penalty)
        return round(min(1.0, final_mastery), 3)
    
    def calculate_module_mastery(self, topic_masteries: Dict[str, float]) -> float:
        """
        Calculate module mastery from topic masteries.
        
        Args:
            topic_masteries: Dict of topic_id -> mastery score
        
        Returns:
            Module mastery 0-1
        """
        if not topic_masteries:
            return 0.0
        return sum(topic_masteries.values()) / len(topic_masteries)
    
    def calculate_course_gpa(self, topic_masteries: Dict[str, float]) -> float:
        """
        Calculate GPA from topic masteries.
        
        Uses 4.0 scale:
        - 90%+ = 4.0
        - 80%+ = 3.0
        - 70%+ = 2.0
        - 60%+ = 1.0
        - Below = 0.0
        
        Args:
            topic_masteries: Dict of topic_id -> mastery score
        
        Returns:
            GPA on 4.0 scale
        """
        if not topic_masteries:
            return 0.0
        
        avg_mastery = sum(topic_masteries.values()) / len(topic_masteries)
        
        if avg_mastery >= 0.9:
            return 4.0
        elif avg_mastery >= 0.8:
            return 3.0 + (avg_mastery - 0.8) * 10  # 3.0-4.0
        elif avg_mastery >= 0.7:
            return 2.0 + (avg_mastery - 0.7) * 10  # 2.0-3.0
        elif avg_mastery >= 0.6:
            return 1.0 + (avg_mastery - 0.6) * 10  # 1.0-2.0
        else:
            return max(0.0, avg_mastery * 10 / 6)  # 0.0-1.0
    
    def get_next_topic(self, user_masteries: Dict[str, float], 
                       course_id: str) -> Optional[Dict[str, Any]]:
        """
        Get next recommended topic based on mastery.
        
        Prioritizes:
        1. Weak topics (mastery < 0.7)
        2. Incomplete topics (not started)
        3. Sequential progression
        
        Args:
            user_masteries: User's topic mastery scores
            course_id: Course to find next topic in
        
        Returns:
            Recommended next topic or None
        """
        topics = curriculum_loader.get_all_topics_flat(course_id)
        
        if not topics:
            return None
        
        # Find weak topics first
        weak_topics = [
            t for t in topics 
            if user_masteries.get(t["id"], 0) < 0.7
        ]
        
        if weak_topics:
            # Return lowest mastery topic
            weak_topics.sort(key=lambda t: user_masteries.get(t["id"], 0))
            return {
                "topic": weak_topics[0],
                "reason": "remediation",
                "current_mastery": user_masteries.get(weak_topics[0]["id"], 0)
            }
        
        # Find incomplete topics
        incomplete = [
            t for t in topics 
            if t["id"] not in user_masteries
        ]
        
        if incomplete:
            return {
                "topic": incomplete[0],
                "reason": "new_topic",
                "current_mastery": 0
            }
        
        # All complete - return highest for review
        topics.sort(key=lambda t: user_masteries.get(t["id"], 0), reverse=True)
        return {
            "topic": topics[0],
            "reason": "review",
            "current_mastery": user_masteries.get(topics[0]["id"], 0)
        }
    
    def validate_answer_alignment(self, answer: str, topic_id: str) -> Dict[str, Any]:
        """
        Check if answer aligns with topic learning objectives.
        
        Args:
            answer: Student's answer
            topic_id: Topic being studied
        
        Returns:
            Alignment analysis
        """
        topic = curriculum_loader.get_topic(topic_id)
        if not topic:
            return {"aligned": False, "reason": "Topic not found"}
        
        learning_outcomes = topic.get("learning_outcomes", [])
        
        # Simple keyword matching (can be enhanced with semantic matching)
        answer_lower = answer.lower()
        matched_outcomes = []
        
        for outcome in learning_outcomes:
            # Extract key terms from outcome
            outcome_words = set(outcome.lower().split())
            answer_words = set(answer_lower.split())
            
            # Check for overlap
            if len(outcome_words & answer_words) >= 2:
                matched_outcomes.append(outcome)
        
        alignment_score = len(matched_outcomes) / len(learning_outcomes) if learning_outcomes else 0
        
        return {
            "aligned": alignment_score > 0.3,
            "alignment_score": round(alignment_score, 2),
            "matched_outcomes": matched_outcomes,
            "total_outcomes": len(learning_outcomes)
        }


# Singleton instance
curriculum_linker = CurriculumLinker()
