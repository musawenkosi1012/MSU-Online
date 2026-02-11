"""
GPA Calculator Service
Uses standard 4.0 scale with letter grades
"""

from app.shared.utils import percentage_to_letter, letter_to_grade_points, calculate_gpa_score

# Grade point conversion table removed - using shared utils

# Logic replaced by shared utils: percentage_to_letter and letter_to_grade_points

def calculate_gpa(courses):
    """
    Calculate GPA from a list of courses.
    """
    if not courses:
        return {'gpa': 0.0, 'letter_grade': 'N/A', 'total_credits': 0}
    
    total_credits = 0
    total_weighted_points = 0
    
    for course in courses:
        grade = course.get('grade', 'F')
        credits = course.get('credits', 3) # Default 3 credits
        
        grade_points = letter_to_grade_points(grade)
        weighted_points = grade_points * credits
        
        total_weighted_points += weighted_points
        total_credits += credits
    
    if total_credits == 0:
        return {'gpa': 0.0, 'letter_grade': 'N/A', 'total_credits': 0}
    
    gpa = total_weighted_points / total_credits
    # Note: We don't have a direct gpa_to_letter in shared utils yet, but we can do it via percentage if needed
    # For now, let's keep the local gpa_to_letter logic if we need it for aggregate GPA
    if gpa >= 3.85: letter_grade = 'A'
    elif gpa >= 3.5: letter_grade = 'A-'
    elif gpa >= 3.15: letter_grade = 'B+'
    elif gpa >= 2.85: letter_grade = 'B'
    elif gpa >= 2.5: letter_grade = 'B-'
    elif gpa >= 2.15: letter_grade = 'C+'
    elif gpa >= 1.85: letter_grade = 'C'
    elif gpa >= 1.5: letter_grade = 'C-'
    elif gpa >= 1.15: letter_grade = 'D+'
    elif gpa >= 0.5: letter_grade = 'D'
    else: letter_grade = 'F'
    
    return {
        'gpa': round(gpa, 2),
        'letter_grade': letter_grade,
        'total_credits': total_credits,
        'total_weighted_points': round(total_weighted_points, 1)
    }

class GPAService:
    def __init__(self):
        pass
    
    def get_gpa(self, db, user_id: int):
        """Get current GPA calculation using real database analytics."""
        from app.core.database import CourseAnalytics, Course
        
        analytics_records = db.query(CourseAnalytics).filter_by(user_id=user_id).all()
        gpa_courses = []
        
        for record in analytics_records:
            # Fetch course for title and credits
            course = db.query(Course).filter_by(id=record.course_id).first()
            if not course:
                continue
                
            # Convert total score (percentage) to letter grade
            # total_score = (exercise + final) / 2 if we use the simple sum from AssessmentService
            # Wait, AssessmentService.update_analytics does: total_score = ex + final
            # If ex is 100 and final is 100, total is 200. We should normalize.
            
            # Re-calculate the percentage from the scores in CourseAnalytics using shared logic
            percentage = calculate_gpa_score(record.exercise_score, record.final_exam_score)
            grade = percentage_to_letter(percentage)

            gpa_courses.append({
                'title': course.title,
                'grade': grade,
                'credits': course.credit_value or 3
            })
            
        result = calculate_gpa(gpa_courses)
        result['courses'] = gpa_courses
        return result

    def get_gpa_breakdown(self, db, user_id: int):
        """Get detailed GPA breakdown from CourseAnalytics."""
        from app.core.database import CourseAnalytics
        
        records = db.query(CourseAnalytics).filter_by(user_id=user_id).all()
        
        gpa_data = self.get_gpa(db, user_id)
        
        return {
            "percentage": 0, # Could aggregate if needed
            "grade": gpa_data['letter_grade'],
            "gpa": gpa_data['gpa'],
            "status": "Active",
            "courses": [
                {
                    "course_id": r.course_id,
                    "exercises": r.exercise_score,
                    "final_exam": r.final_exam_score,
                    "total": r.total_score
                }
                for r in records
            ]
        }
    
    def get_grade_scale(self):
        """Get the grade point scale."""
        return {
            'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0
        }

# Singleton instance
gpa_service = GPAService()
