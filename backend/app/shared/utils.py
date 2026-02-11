"""
Shared Utilities Module
Centralized logic for grading and calculations.
"""

def percentage_to_letter(percentage: float) -> str:
    """Convert a numeric percentage (0-100) to a letter grade."""
    if percentage >= 90: return 'A'
    elif percentage >= 85: return 'A-'
    elif percentage >= 80: return 'B+'
    elif percentage >= 75: return 'B'
    elif percentage >= 70: return 'B-'
    elif percentage >= 65: return 'C+'
    elif percentage >= 60: return 'C'
    elif percentage >= 55: return 'C-'
    elif percentage >= 50: return 'D'
    else: return 'F'

def letter_to_grade_points(letter: str) -> float:
    """Convert a letter grade to a 4.0 scale point value."""
    GRADE_POINTS = {
        'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
    }
    return GRADE_POINTS.get(letter.upper(), 0.0)

def calculate_gpa_score(exercise_score: float, final_exam_score: float) -> float:
    """Standardized GPA weighting: 40% Exercises, 60% Final Exam."""
    return (exercise_score * 0.40) + (final_exam_score * 0.60)
