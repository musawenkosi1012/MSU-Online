"""
AI Session Service
Manages dual-mode AI sessions (Chat + Interactive) with tutor state machine.
"""
from app.core.database import SessionLocal, StudentPerformance, AISession
import uuid
import json
import datetime
from typing import Dict, Any, Optional, List
from enum import Enum

# Tutor State Machine States
class TutorState(str, Enum):
    INTRODUCE = "INTRODUCE"
    EXPLAIN = "EXPLAIN"
    CHECK = "CHECK_UNDERSTANDING"
    ASSESS = "ASSESS"
    UPDATE = "UPDATE_MASTERY"
    ADVANCE = "ADVANCE"
    REMEDIATE = "REMEDIATE"

# Valid state transitions
STATE_TRANSITIONS = {
    TutorState.INTRODUCE: [TutorState.EXPLAIN],
    TutorState.EXPLAIN: [TutorState.CHECK],
    TutorState.CHECK: [TutorState.ASSESS, TutorState.EXPLAIN],
    TutorState.ASSESS: [TutorState.UPDATE],
    TutorState.UPDATE: [TutorState.ADVANCE, TutorState.REMEDIATE],
    TutorState.ADVANCE: [TutorState.INTRODUCE],
    TutorState.REMEDIATE: [TutorState.EXPLAIN],
}

# SESSIONS_FILE removed in favor of SQLAlchemy

class AISessionService:
    def __init__(self):
        pass
    
    def _format_session(self, session: AISession) -> Dict[str, Any]:
        """Convert SQLAlchemy model to dict."""
        return {
            "session_id": session.session_id,
            "user_id": str(session.user_id),
            "mode": session.mode,
            "course_id": session.course_id,
            "topic_id": session.topic_id,
            "state": session.state,
            "mastery": session.mastery,
            "hints_used": session.hints_used,
            "messages": json.loads(session.messages_json),
            "created_at": session.created_at.isoformat(),
            "last_activity": session.last_activity.isoformat()
        }
    
    # ==========================================
    # SESSION MANAGEMENT
    # ==========================================
    
    def create_session(self, user_id: str, mode: str, course_id: str = None, topic_id: str = None) -> Dict[str, Any]:
        """Create a new AI session in DB."""
        db = SessionLocal()
        try:
            session_id = str(uuid.uuid4())
            new_session = AISession(
                session_id=session_id,
                user_id=int(user_id),
                mode=mode,
                course_id=course_id,
                topic_id=topic_id,
                state=TutorState.INTRODUCE.value if mode == "interactive" else None,
                messages_json=json.dumps([])
            )
            db.add(new_session)
            db.commit()
            db.refresh(new_session)
            return self._format_session(new_session)
        finally:
            db.close()
    
    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID from DB."""
        db = SessionLocal()
        try:
            session = db.query(AISession).filter_by(session_id=session_id).first()
            return self._format_session(session) if session else None
        finally:
            db.close()
    
    def get_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all sessions for a user from DB."""
        db = SessionLocal()
        try:
            sessions = db.query(AISession).filter_by(user_id=int(user_id)).all()
            return [self._format_session(s) for s in sessions]
        finally:
            db.close()
    
    def get_user_memory(self, user_id: int) -> Dict[str, Any]:
        """
        Get long-term user memory for personalization.
        Aggregates data from DB and all user sessions.
        """
        from app.core.database import SessionLocal, StudentPerformance
        db = SessionLocal()
        user_sessions = self.get_user_sessions(str(user_id))
        
        # Aggregate topics and mistakes from DB
        db_perf = db.query(StudentPerformance).filter_by(user_id=user_id).all()
        topics_covered = {p.topic_id for p in db_perf}
        common_mistakes = []
        for p in db_perf:
            if p.mistakes_json:
                mistakes = json.loads(p.mistakes_json)
                common_mistakes.extend(mistakes)
        
        # Aggregate stats
        total_mastery = sum(p.mastery for p in db_perf if p.mastery) if db_perf else 0
        hints_total = sum(s.get("hints_used", 0) for s in user_sessions)
        
        # Calculate overall mastery
        overall_mastery = total_mastery / len(db_perf) if db_perf else 0
        
        # Determine learning style
        learning_style = self._infer_learning_style(user_sessions)
        db.close()
        
        return {
            "topics_covered": list(topics_covered),
            "overall_mastery": round(overall_mastery, 2),
            "total_sessions": len(user_sessions),
            "total_hints_used": hints_total,
            "learning_style": learning_style,
            "common_mistakes": list(set(common_mistakes))[:10], # Top 10 unique
            "preferred_topics": [] 
        }

    def record_mistake(self, user_id: int, topic_id: str, mistake_text: str):
        """Log a student mistake to DB for future remediation."""
        from app.core.database import SessionLocal, StudentPerformance
        db = SessionLocal()
        try:
            perf = db.query(StudentPerformance).filter_by(user_id=user_id, topic_id=topic_id).first()
            if perf:
                mistakes = json.loads(perf.mistakes_json) if perf.mistakes_json else []
                if mistake_text not in mistakes:
                    mistakes.append(mistake_text)
                    perf.mistakes_json = json.dumps(mistakes)
                    db.commit()
        except:
            db.rollback()
        finally:
            db.close()
    
    def _infer_learning_style(self, sessions: List[Dict[str, Any]]) -> str:
        """Infer learning style from session patterns."""
        if not sessions:
            return "balanced"
        
        interactive_count = sum(1 for s in sessions if s.get("mode") == "interactive")
        chat_count = sum(1 for s in sessions if s.get("mode") == "chat")
        
        if interactive_count > chat_count * 2:
            return "hands-on"
        elif chat_count > interactive_count * 2:
            return "conversational"
        else:
            return "balanced"

    # ==========================================
    # CHAT MODE
    # ==========================================
    
    def add_chat_message(self, session_id: str, role: str, content: str, web_scraped: bool = False) -> Dict[str, Any]:
        """Add a message to chat session in DB."""
        db = SessionLocal()
        try:
            session = db.query(AISession).filter_by(session_id=session_id).first()
            if not session:
                return None
            
            messages = json.loads(session.messages_json)
            message = {
                "role": role,
                "content": content,
                "web_scraped": web_scraped,
                "timestamp": datetime.datetime.now().isoformat()
            }
            messages.append(message)
            session.messages_json = json.dumps(messages)
            session.last_activity = datetime.datetime.utcnow()
            db.commit()
            return message
        finally:
            db.close()
    
    def get_chat_context(self, session_id: str, max_messages: int = 10) -> str:
        """Get conversation context for AI prompt."""
        session = self.get_session(session_id)
        if not session:
            return ""
        
        messages = session["messages"][-max_messages:]
        context = ""
        for msg in messages:
            prefix = "[STUDENT]" if msg["role"] == "user" else "[MUSA]"
            context += f"{prefix} {msg['content']}\n"
        return context
    
    # ==========================================
    # TUTOR STATE MACHINE (Interactive Mode)
    # ==========================================
    
    def get_current_state(self, session_id: str) -> Optional[str]:
        """Get current tutor state."""
        session = self.get_session(session_id)
        return session["state"] if session else None
    
    def transition_state(self, session_id: str, new_state: str) -> Dict[str, Any]:
        """Transition to a new state in DB if valid."""
        db = SessionLocal()
        try:
            session = db.query(AISession).filter_by(session_id=session_id).first()
            if not session or session.mode != "interactive":
                return {"error": "Invalid session or not in interactive mode"}
            
            current = TutorState(session.state)
            target = TutorState(new_state)
            
            valid_transitions = STATE_TRANSITIONS.get(current, [])
            if target not in valid_transitions:
                return {
                    "error": f"Invalid transition from {current.value} to {target.value}",
                    "valid_transitions": [s.value for s in valid_transitions]
                }
            
            session.state = target.value
            session.last_activity = datetime.datetime.utcnow()
            db.commit()
            
            return {
                "previous_state": current.value,
                "current_state": target.value,
                "session_id": session_id
            }
        finally:
            db.close()
    
    def record_hint_used(self, session_id: str):
        """Record that a hint was used in DB."""
        db = SessionLocal()
        try:
            session = db.query(AISession).filter_by(session_id=session_id).first()
            if session:
                session.hints_used += 1
                db.commit()
        finally:
            db.close()
    
    def update_session_mastery(self, session_id: str, reading_score: float, exercise_score: float) -> float:
        """Update mastery for interactive session in DB."""
        db = SessionLocal()
        try:
            session = db.query(AISession).filter_by(session_id=session_id).first()
            if not session:
                return 0.0
            
            penalty = session.hints_used * 0.05
            mastery = (reading_score * 0.3) + (exercise_score * 0.7) - penalty
            mastery = max(0.0, min(1.0, mastery))
            
            session.mastery = round(mastery, 3)
            db.commit()
            return session.mastery
        finally:
            db.close()
    
    # ==========================================
    # TUTOR PROMPT GENERATION
    # ==========================================
    
    def get_tutor_prompt(self, session_id: str, user_input: str, topic_context: str = "") -> str:
        """Generate AI prompt based on current tutor state."""
        session = self.get_session(session_id)
        if not session:
            return ""
        
        state = session.get("state", TutorState.INTRODUCE.value)
        mastery = session.get("mastery", 0.0)
        
        state_prompts = {
            TutorState.INTRODUCE.value: f"""You are Musa, the EduNexus AI Tutor. 
You are INTRODUCING a new topic to the student. Be welcoming and set context.
Topic: {topic_context}
Student says: {user_input}
Provide a warm introduction to this topic. Explain what they will learn and why it matters.""",

            TutorState.EXPLAIN.value: f"""You are Musa, the EduNexus AI Tutor.
You are EXPLAINING concepts to the student. Be clear and use examples.
Topic: {topic_context}
Current mastery: {mastery*100:.0f}%
Student says: {user_input}
Explain the concept clearly. Use analogies and examples. Break down complex ideas.""",

            TutorState.CHECK.value: f"""You are Musa, the EduNexus AI Tutor.
You are CHECKING UNDERSTANDING. Ask a probing question to assess comprehension.
Topic: {topic_context}
Student says: {user_input}
Based on their response, assess if they understand. Ask a follow-up question or confirm understanding.""",

            TutorState.ASSESS.value: f"""You are Musa, the EduNexus AI Tutor.
You are ASSESSING the student with an exercise. Grade their response fairly.
Topic: {topic_context}
Student says: {user_input}
Evaluate their answer. Provide specific feedback. This affects their grade.""",

            TutorState.UPDATE.value: f"""You are Musa, the EduNexus AI Tutor.
You have just updated the student's mastery score.
Current mastery: {mastery*100:.0f}%
Provide encouraging feedback about their progress.""",

            TutorState.ADVANCE.value: f"""You are Musa, the EduNexus AI Tutor.
The student is ready to ADVANCE to the next topic.
Congratulate them and prepare to introduce the next concept.""",

            TutorState.REMEDIATE.value: f"""You are Musa, the EduNexus AI Tutor.
The student needs REMEDIATION. Be supportive and re-explain the concept.
Topic: {topic_context}
Current mastery: {mastery*100:.0f}%
Provide additional examples and simpler explanations."""
        }
        
        return state_prompts.get(state, state_prompts[TutorState.EXPLAIN.value])
    
    # ==========================================
    # CHAT PROMPT GENERATION
    # ==========================================
    
    def get_chat_prompt(self, session_id: str, user_input: str, topic_context: str = "", web_data: str = "") -> str:
        """Generate AI prompt for chat mode."""
        context = self.get_chat_context(session_id)
        
        web_section = ""
        if web_data:
            web_section = f"""
[Web Data Retrieved]
{web_data}
Use this information to answer the question, but cite that it comes from external sources.
"""
        
        return f"""You are Musa, the EduNexus AI Tutor.
You are in CHAT mode - helping the student with quick questions and clarifications.
This conversation does NOT affect their grades.

Course Context: {topic_context}
{web_section}
Conversation History:
{context}

Student says: {user_input}

Provide a helpful, concise answer. Be friendly and educational."""


# Singleton instance
ai_session_service = AISessionService()
