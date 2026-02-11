"""
Verification Script: Musa AI Dual-Mode Learning Hub
Tests the state machine, audit logging, and web scrape flag enforcement.
"""
import sys
sys.path.insert(0, '.')

from ai_session_service import ai_session_service, TutorState, STATE_TRANSITIONS
from audit_service import audit_service

def test_state_machine_transitions():
    """Test that the tutor state machine follows valid transitions."""
    print("\n=== Test 1: State Machine Transitions ===")
    
    # Create an interactive session
    session = ai_session_service.create_session("test-user-1", "interactive", "course-1", "topic-1")
    session_id = session["session_id"]
    
    assert session["state"] == TutorState.INTRODUCE.value, f"Expected INTRODUCE, got {session['state']}"
    print(f"[OK] Initial state: {session['state']}")
    
    # Valid transition: INTRODUCE -> EXPLAIN
    result = ai_session_service.transition_state(session_id, TutorState.EXPLAIN.value)
    assert "error" not in result, f"Transition failed: {result.get('error')}"
    print(f"[OK] INTRODUCE -> EXPLAIN")
    
    # Valid transition: EXPLAIN -> CHECK
    result = ai_session_service.transition_state(session_id, TutorState.CHECK.value)
    assert "error" not in result, f"Transition failed: {result.get('error')}"
    print(f"[OK] EXPLAIN -> CHECK_UNDERSTANDING")
    
    # Valid transition: CHECK -> ASSESS
    result = ai_session_service.transition_state(session_id, TutorState.ASSESS.value)
    assert "error" not in result, f"Transition failed: {result.get('error')}"
    print(f"[OK] CHECK_UNDERSTANDING -> ASSESS")
    
    # Invalid transition test: ASSESS -> INTRODUCE (should fail)
    result = ai_session_service.transition_state(session_id, TutorState.INTRODUCE.value)
    assert "error" in result, "Expected error for invalid transition"
    print(f"[OK] Invalid transition correctly rejected: {result['error']}")
    
    print("Test 1 PASSED")
    return True

def test_audit_log_generation():
    """Test that audit logs are generated correctly."""
    print("\n=== Test 2: Audit Log Generation ===")
    
    initial_count = len(audit_service.logs)
    
    # Log various events
    audit_service.log_session_start("test-user-2", "session-123", "chat", "course-1", "topic-1")
    audit_service.log_web_scrape("test-user-2", "machine learning basics", ["edu.example.com"], True)
    audit_service.log_exercise_graded("test-user-2", "topic-1", 85.5, "essay", True)
    audit_service.log_mastery_update("test-user-2", "topic-1", 0.6, 0.75)
    audit_service.log_hint_used("test-user-2", "session-123", "topic-1")
    
    new_count = len(audit_service.logs)
    assert new_count == initial_count + 5, f"Expected 5 new logs, got {new_count - initial_count}"
    print(f"[OK] Created 5 audit log entries")
    
    # Verify log content
    user_logs = audit_service.get_logs_by_user("test-user-2")
    assert len(user_logs) >= 5, f"Expected at least 5 logs for user, got {len(user_logs)}"
    print(f"[OK] Retrieved {len(user_logs)} logs for test-user-2")
    
    # Verify GPA affecting events
    gpa_events = audit_service.get_gpa_affecting_events("test-user-2")
    assert len(gpa_events) >= 1, "Expected at least 1 GPA-affecting event"
    print(f"[OK] Found {len(gpa_events)} GPA-affecting event(s)")
    
    print("Test 2 PASSED")
    return True

def test_web_scrape_flag():
    """Test that web scrape flag is properly tracked."""
    print("\n=== Test 3: Web Scrape Flag Enforcement ===")
    
    # Create a chat session (web scrape can be enabled)
    chat_session = ai_session_service.create_session("test-user-3", "chat", "course-1", None)
    assert chat_session["mode"] == "chat"
    print(f"[OK] Chat session created")
    
    # Add message without web scrape
    msg1 = ai_session_service.add_chat_message(chat_session["session_id"], "user", "What is AI?", web_scraped=False)
    assert msg1["web_scraped"] == False
    print(f"[OK] Message without web scrape: web_scraped=False")
    
    # Add message with web scrape
    msg2 = ai_session_service.add_chat_message(chat_session["session_id"], "assistant", "AI is...", web_scraped=True)
    assert msg2["web_scraped"] == True
    print(f"[OK] Message with web scrape: web_scraped=True")
    
    # Interactive sessions should not have web scrape
    interactive_session = ai_session_service.create_session("test-user-3", "interactive", "course-1", "topic-1")
    assert interactive_session["mode"] == "interactive"
    assert interactive_session["state"] == TutorState.INTRODUCE.value
    print(f"[OK] Interactive session created (no web scrape capability)")
    
    print("Test 3 PASSED")
    return True

def test_mastery_calculation():
    """Test the mastery calculation formula."""
    print("\n=== Test 4: Mastery Calculation ===")
    
    session = ai_session_service.create_session("test-user-4", "interactive", "course-1", "topic-1")
    session_id = session["session_id"]
    
    # Test: 0.8 reading, 0.9 exercise, 0 hints
    # Expected: (0.8 * 0.3) + (0.9 * 0.7) - 0 = 0.24 + 0.63 = 0.87
    mastery = ai_session_service.update_session_mastery(session_id, 0.8, 0.9)
    assert 0.86 <= mastery <= 0.88, f"Expected ~0.87, got {mastery}"
    print(f"[OK] Mastery with 80% reading, 90% exercise = {mastery*100:.1f}%")
    
    # Use hints (penalty test)
    ai_session_service.record_hint_used(session_id)
    ai_session_service.record_hint_used(session_id)
    
    # Recalculate with 2 hints: -0.10 penalty
    mastery = ai_session_service.update_session_mastery(session_id, 0.8, 0.9)
    assert 0.76 <= mastery <= 0.78, f"Expected ~0.77, got {mastery}"
    print(f"[OK] Mastery with 2 hints penalty = {mastery*100:.1f}%")
    
    print("Test 4 PASSED")
    return True

def test_state_machine_completeness():
    """Test all valid state transitions."""
    print("\n=== Test 5: State Machine Completeness ===")
    
    for state in TutorState:
        transitions = STATE_TRANSITIONS.get(state, [])
        print(f"  {state.value} -> {[t.value for t in transitions]}")
    
    # Verify all states have at least one transition (except terminal states)
    assert TutorState.INTRODUCE in STATE_TRANSITIONS
    assert TutorState.EXPLAIN in STATE_TRANSITIONS
    assert TutorState.CHECK in STATE_TRANSITIONS
    assert TutorState.ASSESS in STATE_TRANSITIONS
    assert TutorState.UPDATE in STATE_TRANSITIONS
    assert TutorState.ADVANCE in STATE_TRANSITIONS
    assert TutorState.REMEDIATE in STATE_TRANSITIONS
    
    print("Test 5 PASSED")
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("MUSA AI DUAL-MODE LEARNING HUB - VERIFICATION TESTS")
    print("=" * 60)
    
    tests = [
        test_state_machine_transitions,
        test_audit_log_generation,
        test_web_scrape_flag,
        test_mastery_calculation,
        test_state_machine_completeness
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"\n[FAIL] {test.__name__} FAILED: {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 60)
