"""
Verification script for the Unified Course Outline & Progress Tracking system.
Tests the deterministic algorithms for reading progress, mastery calculation, and exercise unlock.
"""
import sys
import os
sys.path.append(os.getcwd())

from progress_service import progress_service

def verify_progress_tracking():
    print("=" * 60)
    print("VERIFICATION: Unified Course Outline & Progress Tracking")
    print("=" * 60)
    
    user_id = "test-user-001"
    topic_id = "topic-1-1-1"
    
    # 1. Test Reading Progress Calculation
    print("\n[1] Testing Reading Progress Algorithm")
    print("    Formula: (scroll_depth * 0.6) + (time_score * 0.4)")
    
    # 50% scroll, 60 seconds spent (min_time = 120s)
    result = progress_service.update_reading_progress(
        user_id=user_id,
        topic_id=topic_id,
        scroll_depth=0.5,
        time_spent=60,
        min_time=120
    )
    # Expected: (0.5 * 0.6) + (0.5 * 0.4) = 0.3 + 0.2 = 0.5
    print(f"    Scroll: 50%, Time: 60s/120s")
    print(f"    Expected read_progress: 0.5")
    print(f"    Actual read_progress: {result['read_progress']}")
    assert result['read_progress'] == 0.5, f"Expected 0.5, got {result['read_progress']}"
    print("    [PASS]")
    
    # 2. Test Exercise Unlock Logic
    print("\n[2] Testing Exercise Unlock Logic")
    print("    Threshold: read_progress >= 0.8")
    
    unlocked = progress_service.check_exercise_unlock(user_id, topic_id)
    print(f"    At 50% progress: Unlocked = {unlocked}")
    assert unlocked == False, "Exercise should NOT be unlocked at 50%"
    print("    [PASS] (correctly locked)")
    
    # Now update to 100% scroll, full time
    result = progress_service.update_reading_progress(
        user_id=user_id,
        topic_id=topic_id,
        scroll_depth=1.0,
        time_spent=120,
        min_time=120
    )
    # Expected: (1.0 * 0.6) + (1.0 * 0.4) = 0.6 + 0.4 = 1.0
    unlocked = progress_service.check_exercise_unlock(user_id, topic_id)
    print(f"    At 100% progress: Unlocked = {unlocked}")
    assert unlocked == True, "Exercise should be unlocked at 100%"
    print("    [PASS] (correctly unlocked)")
    
    # 3. Test Topic Mastery Calculation
    print("\n[3] Testing Topic Mastery Algorithm")
    print("    Formula: read_progress * 0.4 + (exercise_score / 100) * 0.6")
    
    # Submit exercise score
    result = progress_service.update_exercise_score(user_id, topic_id, 80)
    # Expected: 1.0 * 0.4 + 0.8 * 0.6 = 0.4 + 0.48 = 0.88
    print(f"    read_progress: 1.0, exercise_score: 80")
    print(f"    Expected mastery: 0.88")
    print(f"    Actual mastery: {result['mastery']}")
    assert result['mastery'] == 0.88, f"Expected 0.88, got {result['mastery']}"
    print("    [PASS]")
    
    # 4. Test Completion Threshold
    print("\n[4] Testing Completion Threshold")
    print("    Threshold: mastery >= 0.75")
    print(f"    Completed: {result['completed']}")
    assert result['completed'] == True, "Topic should be marked as completed"
    print("    [PASS]")
    
    # 5. Test Course Mastery Aggregation
    print("\n[5] Testing Course Mastery Aggregation")
    topic_weights = {
        topic_id: 0.25,  # This topic has 25% weight
        "topic-1-1-2": 0.25,
        "topic-1-1-3": 0.30,
        "topic-1-1-4": 0.20
    }
    course_mastery = progress_service.get_course_mastery(user_id, "course-1", topic_weights)
    print(f"    Topic {topic_id} has mastery 0.88 with weight 0.25")
    print(f"    Aggregate mastery: {course_mastery['aggregate_mastery']}")
    # Expected: 0.88 * 0.25 = 0.22 (only one topic has progress)
    assert course_mastery['aggregate_mastery'] == 0.22, f"Expected 0.22, got {course_mastery['aggregate_mastery']}"
    print("    [PASS]")
    
    # 6. Test Exam Unlock Logic
    print("\n[6] Testing Exam Unlock Logic")
    print("    Threshold: aggregate_mastery >= 0.7")
    print(f"    Exam unlocked: {course_mastery['exam_unlocked']}")
    assert course_mastery['exam_unlocked'] == False, "Exam should NOT be unlocked at 22%"
    print("    [PASS] (correctly locked)")
    
    print("\n" + "=" * 60)
    print("ALL VERIFICATION TESTS PASSED")
    print("=" * 60)

if __name__ == "__main__":
    verify_progress_tracking()
