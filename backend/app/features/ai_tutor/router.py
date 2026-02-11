"""
AI Tutor Feature Router (Enhanced)
Chat and interactive mode with RAG, tools, and analytics.
"""
import time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

# Core modules
from app.core.rag.retriever import retriever
from app.core.tools.tool_router import tool_router
from app.core.curriculum.loader import curriculum_loader
from app.core.curriculum.linker import curriculum_linker
from app.core.analytics.metrics import analytics_collector

# Feature modules
from .session_service import ai_session_service, TutorState
from app.features.auth.service import auth_service
from app.features.progress.service import progress_service
from app.shared.model_service import model_service
from app.shared.audit import audit_service
from app.core.database import User

router = APIRouter()


# ============================================
# REQUEST MODELS
# ============================================

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    course_id: Optional[str] = None
    topic_id: Optional[str] = None
    allow_web_scrape: bool = False
    use_reasoning: bool = False  # Enable two-pass reasoning


class InteractiveRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    course_id: Optional[str] = None
    topic_id: Optional[str] = None
    action: Optional[str] = None  # "hint", "skip", "next"


class IndexCourseRequest(BaseModel):
    course_id: str


# ============================================
# RAG MANAGEMENT ENDPOINTS
# ============================================

@router.post("/index/course")
async def index_course_for_rag(
    data: IndexCourseRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Index a course into the RAG vector store."""
    from app.features.courses.service import course_service
    
    course = course_service.get_course_by_id(data.course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    chunks_indexed = retriever.index_course(course)
    
    return {
        "status": "indexed",
        "course_id": data.course_id,
        "chunks_indexed": chunks_indexed
    }


@router.get("/rag/stats")
async def get_rag_stats(
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get RAG retrieval statistics."""
    return retriever.get_stats()


# ============================================
# CHAT MODE (RAG-Enhanced)
# ============================================

@router.post("/chat")
async def ai_chat(
    data: ChatRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """
    Chat mode with RAG context injection.
    Does NOT affect GPA.
    """
    start_time = time.time()
    user_id = str(current_user.id)
    
    # Get or create session
    session_id = data.session_id
    if not session_id:
        session = ai_session_service.create_session(
            user_id, "chat", data.course_id, data.topic_id
        )
        session_id = session["session_id"]
    
    # Add user message
    ai_session_service.add_chat_message(session_id, "user", data.message)
    
    # Check if tools are needed
    tool_result = tool_router.route(data.message)
    tool_context = tool_result.get("inject_context", "")
    
    # Get user memory for personalization
    user_memory = ai_session_service.get_user_memory(user_id)
    
    # Get conversation history
    conversation_history = ai_session_service.get_chat_context(session_id)
    
    # Generate response with RAG
    if data.use_reasoning:
        result = model_service.generate_with_reasoning(
            data.message, data.course_id
        )
        response = result["response"]
        confidence = result.get("confidence", 0.7)
        rag_context = []
    else:
        # Standard RAG generation
        if tool_context:
            # Inject tool result into query
            enhanced_query = f"{data.message}\n\n{tool_context}"
        else:
            enhanced_query = data.message
        
        result = model_service.generate_with_rag(
            enhanced_query,
            course_id=data.course_id,
            user_memory=user_memory,
            conversation_history=conversation_history,
            max_tokens=500
        )
        response = result["response"]
        confidence = result.get("confidence", 0.5)
        rag_context = result.get("retrieved_context", [])
    
    # Add AI response
    ai_session_service.add_chat_message(session_id, "assistant", response)
    
    # Track analytics
    response_time_ms = int((time.time() - start_time) * 1000)
    analytics_collector.log_query(
        data.message, response,
        rag_used=bool(rag_context),
        confidence=confidence,
        response_time_ms=response_time_ms
    )
    
    return {
        "session_id": session_id,
        "response": response,
        "confidence": confidence,
        "tool_used": tool_result.get("tool_used"),
        "rag_sources": result.get("sources", []),
        "affects_gpa": False,
        "response_time_ms": response_time_ms
    }


# ============================================
# INTERACTIVE MODE (RAG + State Machine)
# ============================================

@router.post("/interactive")
async def ai_interactive(
    data: InteractiveRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """
    Interactive tutoring mode with state machine.
    AFFECTS GPA.
    """
    start_time = time.time()
    user_id = str(current_user.id)
    
    # Get User Interactive Memory (Mastery, Style, Mistakes)
    user_memory = ai_session_service.get_user_memory(current_user.id)
    
    # Get or create session
    session_id = data.session_id
    if not session_id:
        session = ai_session_service.create_session(
            user_id, "interactive", data.course_id, data.topic_id
        )
        session_id = session["session_id"]
        audit_service.log_session_start(
            user_id, session_id, "interactive", 
            data.course_id, data.topic_id
        )
    
    session = ai_session_service.get_session(session_id)
    current_state = session.get("state", TutorState.INTRODUCE.value)
    
    # Handle special actions
    if data.action == "hint":
        ai_session_service.record_hint_used(session_id)
        audit_service.log_hint_used(user_id, session_id, data.topic_id)
    
    # Add user message
    ai_session_service.add_chat_message(session_id, "user", data.message)
    
    # Get course/topic context
    topic = curriculum_loader.get_topic(data.topic_id) if data.topic_id else {}
    course_data = {
        "course_id": data.course_id,
        "course_title": topic.get("course_title", "Unknown Course"),
        "topic_id": data.topic_id,
        "topic_title": topic.get("title", "Unknown Topic")
    }
    
    # Generate response with state awareness
    result = model_service.generate_interactive(
        data.message,
        tutor_state=current_state,
        course_data=course_data,
        user_memory=user_memory, # Added for personalization
        mastery=session.get("mastery", 0),
        hints_used=session.get("hints_used", 0),
        max_tokens=400
    )
    response = result["response"]
    
    # Add AI response
    ai_session_service.add_chat_message(session_id, "assistant", response)
    
    # Handle state transitions and grading
    affects_gpa = False
    next_state = current_state
    grade_result = None
    
    if current_state == TutorState.ASSESS.value:
        affects_gpa = True
        
        # Grade the response
        topic_title = topic.get("title", "")
        grade_result = model_service.grade_essay(
            topic_title, data.message, topic_id=data.topic_id
        )
        score = grade_result.get("score", 70)
        
        # Record mistakes for future remediation
        if score < 80:
             mistake = grade_result.get("feedback", "Misunderstood concept")
             ai_session_service.record_mistake(current_user.id, data.topic_id, mistake)
        reading_progress = progress_service._get_topic_progress(
            user_id, data.topic_id
        ).get("read_progress", 0)
        
        old_mastery = session.get("mastery", 0)
        new_mastery = ai_session_service.update_session_mastery(
            session_id, reading_progress, score / 100
        )
        
        # Log events
        audit_service.log_exercise_graded(
            user_id, data.topic_id, score, "interactive", True
        )
        audit_service.log_mastery_update(
            user_id, data.topic_id, old_mastery, new_mastery
        )
        analytics_collector.log_mastery_update(
            user_id, data.topic_id, old_mastery, new_mastery
        )
        analytics_collector.log_grading_result(
            user_id, data.topic_id, score, "interactive"
        )
        
        # Update progress
        progress_service.update_exercise_score(user_id, data.topic_id, score)
        
        # Transition state
        next_state = TutorState.UPDATE.value
    
    # Get updated session
    session = ai_session_service.get_session(session_id)
    
    # Track analytics
    response_time_ms = int((time.time() - start_time) * 1000)
    analytics_collector.log_query(
        data.message, response,
        rag_used=True, confidence=0.8,
        response_time_ms=response_time_ms
    )
    
    return {
        "session_id": session_id,
        "response": response,
        "current_state": next_state,
        "mastery": session.get("mastery", 0),
        "hints_used": session.get("hints_used", 0),
        "affects_gpa": affects_gpa,
        "grade_result": grade_result,
        "response_time_ms": response_time_ms
    }


# ============================================
# SESSION MANAGEMENT
# ============================================

@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get session details."""
    session = ai_session_service.get_session(session_id)
    if not session or session["user_id"] != str(current_user.id):
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/sessions")
async def get_user_sessions(
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get all sessions for current user."""
    return ai_session_service.get_user_sessions(str(current_user.id))


@router.post("/session/{session_id}/transition")
async def transition_session_state(
    session_id: str,
    new_state: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Manually transition tutor state."""
    session = ai_session_service.get_session(session_id)
    if not session or session["user_id"] != str(current_user.id):
        raise HTTPException(status_code=404, detail="Session not found")
    
    result = ai_session_service.transition_state(session_id, new_state)
    
    if "error" not in result:
        audit_service.log_state_transition(
            str(current_user.id), session_id,
            result.get("previous_state"), result.get("current_state")
        )
    
    return result


# ============================================
# ANALYTICS & CURRICULUM
# ============================================

@router.get("/analytics")
async def get_ai_analytics(
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get AI analytics summary."""
    return {
        "summary": analytics_collector.get_summary(),
        "rag_performance": analytics_collector.get_rag_performance(),
        "suggestions": analytics_collector.get_optimization_suggestions(),
        "streak_stats": analytics_collector.get_streak_stats()
    }


@router.get("/next-topic/{course_id}")
async def get_next_recommended_topic(
    course_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get next recommended topic based on mastery."""
    user_id = str(current_user.id)
    user_progress = progress_service.get_user_progress(user_id, course_id)
    
    # Build mastery dict
    masteries = {}
    for progress in user_progress:
        topic_id = progress.get("topic_id")
        masteries[topic_id] = progress.get("mastery", 0)
    
    recommendation = curriculum_linker.get_next_topic(masteries, course_id)
    return recommendation


@router.get("/revision-questions")
async def get_revision_questions(
    course_id: str,
    limit: int = 5,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get random revision questions for the AI Hub context."""
    from app.features.assessment.service import assessment_service
    return assessment_service.get_random_revision_questions(str(current_user.id), course_id, limit)


@router.get("/tools/history")
async def get_tool_history(
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get recent tool invocation history."""
    return tool_router.get_tool_history()
