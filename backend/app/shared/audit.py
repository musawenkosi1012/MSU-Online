"""
Audit Service
Event logging for compliance and academic integrity.
Tracks all AI actions including web scraping, exercise grading, and mastery updates.
"""
import json
import os
import datetime
from typing import Dict, Any, List, Optional

AUDIT_LOG_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "audit_log.json")

class AuditService:
    def __init__(self):
        self.logs = self._load_logs()
    
    def _load_logs(self) -> List[Dict[str, Any]]:
        if not os.path.exists(AUDIT_LOG_FILE):
            return []
        try:
            with open(AUDIT_LOG_FILE, 'r') as f:
                return json.load(f)
        except:
            return []
    
    def _save_logs(self):
        try:
            with open(AUDIT_LOG_FILE, 'w') as f:
                json.dump(self.logs, f, indent=2, default=str)
        except Exception as e:
            # POLICY: Force-fail the operation if audit logging fails
            raise IOError(f"CRITICAL: Audit logging failed. Operation aborted for compliance: {e}")
    
    def _log_event(self, event_type: str, user_id: str, data: Dict[str, Any]):
        """Internal method to log any event. Fails loudly on storage error."""
        entry = {
            "id": len(self.logs) + 1,
            "event": event_type,
            "user_id": user_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "data": data
        }
        self.logs.append(entry)
        self._save_logs() # Will raise if fails
        return entry
    
    # ==========================================
    # WEB SCRAPING EVENTS
    # ==========================================
    
    def log_web_scrape(self, user_id: str, query: str, domains: List[str], success: bool) -> Dict[str, Any]:
        """Log when web scraping is used."""
        return self._log_event("WEB_SCRAPE_USED", user_id, {
            "query": query,
            "domains": domains,
            "success": success
        })
    
    # ==========================================
    # EXERCISE GRADING EVENTS
    # ==========================================
    
    def log_exercise_graded(self, user_id: str, topic_id: str, score: float, 
                            question_type: str, affects_gpa: bool) -> Dict[str, Any]:
        """Log when an exercise is graded."""
        return self._log_event("EXERCISE_GRADED", user_id, {
            "topic_id": topic_id,
            "score": score,
            "question_type": question_type,
            "affects_gpa": affects_gpa
        })
    
    # ==========================================
    # MASTERY UPDATE EVENTS
    # ==========================================
    
    def log_mastery_update(self, user_id: str, topic_id: str, 
                           old_mastery: float, new_mastery: float) -> Dict[str, Any]:
        """Log when mastery is updated."""
        return self._log_event("MASTERY_UPDATED", user_id, {
            "topic_id": topic_id,
            "old_mastery": old_mastery,
            "new_mastery": new_mastery,
            "delta": round(new_mastery - old_mastery, 3)
        })
    
    # ==========================================
    # SESSION EVENTS
    # ==========================================
    
    def log_session_start(self, user_id: str, session_id: str, mode: str, 
                          course_id: str = None, topic_id: str = None) -> Dict[str, Any]:
        """Log when a session starts."""
        return self._log_event("SESSION_STARTED", user_id, {
            "session_id": session_id,
            "mode": mode,
            "course_id": course_id,
            "topic_id": topic_id
        })
    
    def log_state_transition(self, user_id: str, session_id: str,
                             from_state: str, to_state: str) -> Dict[str, Any]:
        """Log tutor state machine transitions."""
        return self._log_event("STATE_TRANSITION", user_id, {
            "session_id": session_id,
            "from_state": from_state,
            "to_state": to_state
        })
    
    def log_hint_used(self, user_id: str, session_id: str, topic_id: str) -> Dict[str, Any]:
        """Log when a hint is used (affects mastery penalty)."""
        return self._log_event("HINT_USED", user_id, {
            "session_id": session_id,
            "topic_id": topic_id
        })
    
    # ==========================================
    # AI RESPONSE EVENTS
    # ==========================================
    
    def log_ai_response(self, user_id: str, session_id: str, mode: str,
                        web_scrape_enabled: bool, response_length: int) -> Dict[str, Any]:
        """Log AI response generation."""
        return self._log_event("AI_RESPONSE_GENERATED", user_id, {
            "session_id": session_id,
            "mode": mode,
            "web_scrape_enabled": web_scrape_enabled,
            "response_length": response_length
        })
    
    # ==========================================
    # QUERY METHODS
    # ==========================================
    
    def get_logs_by_user(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get audit logs for a specific user."""
        user_logs = [l for l in self.logs if l["user_id"] == user_id]
        return user_logs[-limit:]
    
    def get_logs_by_event(self, event_type: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get audit logs by event type."""
        event_logs = [l for l in self.logs if l["event"] == event_type]
        return event_logs[-limit:]
    
    def get_web_scrape_logs(self, user_id: str = None, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all web scraping logs for compliance review."""
        if user_id:
            return [l for l in self.logs if l["event"] == "WEB_SCRAPE_USED" and l["user_id"] == user_id][-limit:]
        return [l for l in self.logs if l["event"] == "WEB_SCRAPE_USED"][-limit:]
    
    def get_recent_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get most recent audit logs."""
        return self.logs[-limit:]
    
    def get_gpa_affecting_events(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all events that affected GPA for a user."""
        return [l for l in self.logs 
                if l["user_id"] == user_id 
                and l["event"] == "EXERCISE_GRADED" 
                and l["data"].get("affects_gpa", False)]


# Singleton instance
audit_service = AuditService()
