import json
import os
import random
import uuid
import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import joinedload
from app.core.database import SessionLocal, AssessmentSubmission, CourseAnalytics, Assessment, Course, Module, SubTopic
from app.shared.model_service import model_service
from app.shared.utils import calculate_gpa_score

# ASSESSMENTS_FILE removed - relying on 'assessments' table now.

class AssessmentService:
    def __init__(self):
        pass # No JSON loading needed

    def check_course_completion(self, student_id: str, course_id: str) -> Dict[str, Any]:
        """Check if student has completed all exercises to unlock analytics/exam."""
        from app.features.progress.service import progress_service
        
        db = SessionLocal()
        try:
            c_id = int(course_id) if str(course_id).isdigit() else None
            if not c_id: return {"completed": False, "progress": 0.0}

            # 1. Get Aggregate Mastery
            mastery_data = progress_service.get_course_mastery(int(student_id), c_id)
            aggregate = mastery_data.get("aggregate_mastery", 0.0)
            
            # 2. Total Topics for progress %
            course = db.query(Course).options(
                joinedload(Course.modules).joinedload(Module.sub_topics)
            ).filter(Course.id == c_id).first()
            
            if not course: return {"completed": False, "progress": 0.0}
            
            total_topics = 0
            for m in course.modules:
                total_topics += len(m.sub_topics)
            
            # A course is "unlocked/completed" if aggregate mastery >= 70%
            is_unlocked = aggregate >= 0.7
            
            return {
                "completed": is_unlocked,
                "progress": min(100.0, round(aggregate * 100, 1)),
                "total": total_topics,
                "passed": mastery_data.get("topics_tracked", 0),
                "mastery_score": aggregate
            }
        finally:
            db.close()

    def get_or_create_final_exam(self, course_id: str):
        """Generate or retrieve Final Exam."""
        exam_id = f"final-exam-{course_id}"
        
        db = SessionLocal()
        try:
            # Check DB
            exam = db.query(Assessment).filter(Assessment.id == exam_id).first()
            if exam:
                return {
                    "id": exam.id,
                    "title": "Final Exam",
                    "type": "final_exam",
                    "questions": json.loads(exam.content_json)
                }
            
            # Generate
            c_id = int(course_id) if str(course_id).isdigit() else None
            course = db.query(Course).filter(Course.id == c_id).first()
            if not course: return None
            
            # Get topics list for context
            # (Simplified: just titles)
            try:
                # We need to re-query with options if not loaded, or just query available topics
                # Let's just use course name + standard topics
                topics = ["General Course Knowledge"]
                pass
            except: 
                topics = []

            content = model_service.generate_final_exam_content(course.title, topics)
            
            # Save
            new_exam = Assessment(
                id=exam_id,
                course_id=c_id,
                topic_id="final",
                type="final_exam",
                content_json=json.dumps(content)
            )
            db.add(new_exam)
            db.commit()
            
            return {
                "id": exam_id,
                "title": "Final Exam",
                "type": "final_exam",
                "questions": content
            }
        except Exception as e:
            print(f"Final Exam error: {e}")
            return None
        finally:
            db.close()

    def get_course_assessments(self, course_id: str):
        """Get all assessable topics for a course, creating placeholders if needed."""
        db = SessionLocal()
        try:
            c_id = int(course_id) if str(course_id).isdigit() else None
            if not c_id: return []

            # 1. Fetch Course Structure (Modules -> SubTopics)
            course = db.query(Course).options(
                joinedload(Course.modules).joinedload(Module.sub_topics)
            ).filter(Course.id == c_id).first()

            if not course: return []

            # 2. Fetch Existing Assessments
            existing_assessments = db.query(Assessment).filter(Assessment.course_id == c_id).all()
            assessment_map = {a.topic_id: a for a in existing_assessments}

            results = []
            for module in course.modules:
                for topic in module.sub_topics:
                    # Check if assessment exists
                    t_id = f"{c_id}-{module.id}-{topic.id}"
                    
                    if t_id in assessment_map:
                        assess = assessment_map[t_id]
                        results.append({
                            "id": assess.id,
                            "title": topic.title,
                            "type": assess.type,
                            "status": "ready" # Meaning cached
                        })
                    else:
                        # Placeholder (Assessment will be generated on demand)
                        # Alternate: We could generate the Assessment DB row here with empty content
                        # But for list view, we just need to know it's available.
                        # Logic: Use the topic ID as the potential assessment ID for now, 
                        # or generate a UUID if we want to pre-allocate.
                        # Let's use the stable ID format: assessment-{course}-{topic}
                        a_id = f"assess-{t_id}"
                        results.append({
                            "id": a_id,
                            "title": topic.title,
                            "type": "quiz" if "Introduction" in topic.title or "Basics" in topic.title else "practical",
                            "status": "pending_generation" 
                        })
            return results
        finally:
            db.close()

    def get_or_create_assessment(self, assessment_id: str):
        """Fetch assessment from DB or generate key properties if missing."""
        # Simple retrieval or generation stub. 
        # The real generation happens in 'start_assessment' or specific get method.
        # But here we ensure the content exists.
        
        # ID Format: assess-{course}-{module}-{topic}
        parts = assessment_id.split('-')
        if len(parts) < 4: return None 
        # assess, course, module, topic
        
        try:
            course_id = int(parts[1])
            topic_stable_id = f"{parts[1]}-{parts[2]}-{parts[3]}"
        except:
            return None

        db = SessionLocal()
        try:
            # Check DB
            assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
            if assessment:
                return {
                    "id": assessment.id,
                    "title": "Generated Assessment", # We might need to fetch topic title
                    "type": assessment.type,
                    "questions": json.loads(assessment.content_json)
                }
            
            # 1. Get Topic & Course Type
            sub_topic = db.query(SubTopic).filter(SubTopic.id == int(parts[3])).first()
            if not sub_topic: return None

            course = db.query(Course).filter(Course.id == course_id).first()
            is_programming = course.is_programming if course else False
            
            title = sub_topic.title
            
            # 2. Structure logic based on user requirements
            # Coding Lab: Exercises after EACH sub-topic
            # Learning Hub: One at the end of Chapter
            
            # The type determines the prompt
            a_type = "quiz" if not is_programming else "practical"
            
            # 3. Call AI with specific constraints
            if is_programming:
                # Sub-topic exercise for coding
                content = model_service.generate_coding_task(title) # 10 marks
            else:
                # Ordinary chapter-end assessment (10 MCQ + 3 Open)
                # We only want to generate this if it's the LAST sub-topic of the chapter
                # But for modularity, we generate if requested.
                content = model_service.generate_chapter_assessment(title) 
            
            # 4. Save to DB
            new_assessment = Assessment(
                id=assessment_id,
                course_id=course_id,
                topic_id=topic_stable_id,
                type=a_type,
                content_json=json.dumps(content)
            )
            db.add(new_assessment)
            db.commit()
            
            return {
                "id": assessment_id,
                "title": title,
                "type": a_type,
                "questions": content
            }
        except Exception as e:
            print(f"Error ensuring assessment: {e}")
            return None
        finally:
            db.close()

    def get_student_results(self, student_id: str):
        """Get all submission results for a specific student from DB."""
        db = SessionLocal()
        try:
            results = db.query(AssessmentSubmission).filter_by(user_id=int(student_id)).all()
            return [
                {
                    "student_id": str(r.user_id),
                    "assessment_id": r.assessment_id,
                    "course_id": str(r.course_id),
                    "source": r.source,
                    "type": r.type,
                    "score": r.score,
                    "raw_score": r.raw_score,
                    "max_score": r.max_score,
                    "results": json.loads(r.results_json),
                    "timestamp": r.timestamp.isoformat()
                } for r in results
            ]
        finally:
            db.close()

    def get_assessment(self, assessment_id: str):
        """Retrieve assessment from DB (generating if needed/valid ID)."""
        return self.get_or_create_assessment(assessment_id)

    def register_assessment(self, assessment_data: Dict[str, Any]) -> str:
        """Register a dynamically generated assessment."""
        # Check if exists (by topic/chapter)
        # For simplicity, we might just append or replace.
        # Let's check ID.
        a_id = assessment_data.get("id")
        existing = next((a for a in self.assessments if a["id"] == a_id), None)
        if existing:
            # Update
            self.assessments.remove(existing)
        
        self.assessments.append(assessment_data)
        self._save_json(ASSESSMENTS_FILE, self.assessments)
        return a_id

    def submit(self, student_id: str, assessment_id: str, answers: List[Any], behavior: Dict[str, Any] = None):
        """Process submission with deterministic grading and academic status check."""
        assessment = self.get_assessment(assessment_id)
        if not assessment:
            return {"error": "Assessment not found"}

        results = []
        topic_id = assessment.get("topic_id", "general")
        source = assessment.get("source", "exercise") # 'exercise', 'chapter_exercise', 'final'
        
        # Grading Logic
        total_score = 0
        max_score = 100 # Default
        
        if source == "chapter_exercise":
            # 10 MCQs * 1 = 10, 3 Open * 5 = 15 -> Total 25
            if isinstance(answers, dict):
                mcq_answers = answers.get("mcqs", [])
                open_answers = answers.get("open_ended", [])
                
                # Grade MCQs
                mcq_score = 0
                questions_mcq = assessment.get("mcqs", [])
                for i, ans in enumerate(mcq_answers):
                    if i < len(questions_mcq):
                        is_correct = str(ans) == str(questions_mcq[i]["correct_index"])
                        if is_correct: mcq_score += 1
                        results.append({"type": "mcq", "index": i, "is_correct": is_correct})
                
                # Grade Open-Ended
                open_score = 0
                questions_open = assessment.get("open_ended", [])
                for i, ans in enumerate(open_answers):
                    if i < len(questions_open):
                        rubric = questions_open[i].get("rubric", "")
                        grading = model_service.grade_essay(questions_open[i]["question"], ans, rubric)
                        # AI returns 0-100, scale to 5 marks
                        points = (grading["score"] / 100.0) * 5
                        open_score += points
                        results.append({"type": "open", "index": i, "score": points, "max": 5})
                
                total_score = mcq_score + open_score
                max_score = 25 # (10*1 + 3*5)
                
                # Normalize to percentage for mastery
                percentage = (total_score / max_score) * 100
                final_score = percentage 
                
            else:
                 return {"error": "Invalid answer format for chapter exercise"}
        
        elif source == "final_exam":
            if isinstance(answers, dict):
                mcq_answers = answers.get("mcqs", [])
                open_answers = answers.get("open_ended", [])
                coding_task = answers.get("coding_task")
                
                course_id = assessment.get("course_id")
                db = SessionLocal()
                course = db.query(Course).filter(Course.id == course_id).first()
                is_programming = course.is_programming if course else False
                db.close()

                # 1. Grade MCQs (20 Qs * 1 mark = 20)
                mcq_score = 0
                questions_mcq = assessment.get("mcqs", [])
                for i, ans in enumerate(mcq_answers):
                    if i < len(questions_mcq):
                        is_correct = str(ans) == str(questions_mcq[i].get("correct_index"))
                        if is_correct: mcq_score += 1
                        results.append({"type": "mcq", "index": i, "is_correct": is_correct})
                
                # 2. Grade Essays (4 Qs * 20 marks = 80)
                open_score = 0
                questions_open = assessment.get("open_ended", [])
                for i, ans in enumerate(open_answers):
                    if i < len(questions_open):
                        rubric = questions_open[i].get("rubric", "")
                        grading = model_service.grade_essay(questions_open[i]["question"], ans, rubric)
                        # AI returns 0-100, scale to 20 marks
                        points = (grading["score"] / 100.0) * 20
                        open_score += points
                        results.append({"type": "open", "index": i, "score": points, "max": 20})
                
                # 3. Programming specific: Coding task and 10 extra marks
                coding_score = 0
                if is_programming and coding_task:
                    # Logic for coding task (AI-based grading)
                    grading = model_service.grade_code(assessment.get("coding_prompt"), coding_task)
                    coding_score = (grading["score"] / 100.0) * 10
                    results.append({"type": "coding", "score": coding_score, "max": 10})
                    
                total_score = mcq_score + open_score + coding_score
                max_score = 110 if is_programming else 100
                final_score = (total_score / max_score) * 100
            else:
                 return {"error": "Invalid answer format for final exam"}
        
        # Legacy/Standard Handling
        elif assessment["type"] == "mcq":
            current_total = 0
            questions = assessment["questions"]
            for i, ans in enumerate(answers):
                # Ensure type match
                is_correct = str(ans) == str(questions[i]["correct"])
                if is_correct: current_total += 1
                results.append({"question_index": i, "is_correct": is_correct})
            final_score = (current_total / len(questions)) * 100
            
        else: # Open ended legacy
            current_total = 0
            questions = assessment["questions"]
            for i, ans in enumerate(answers):
                grading = model_service.grade_essay(questions[i]["question"], ans, questions[i].get("reference", ""))
                current_total += grading["score"]
                results.append(grading)
            final_score = current_total / len(questions)

        # Save Submission to DB
        db = SessionLocal()
        try:
            submission = AssessmentSubmission(
                user_id=int(student_id),
                assessment_id=assessment_id,
                course_id=int(assessment["course_id"]) if str(assessment["course_id"]).isdigit() else None,
                source=source,
                type=assessment["type"],
                score=final_score,
                raw_score=total_score if source == "chapter_exercise" else None,
                max_score=max_score if source == "chapter_exercise" else None,
                results_json=json.dumps(results)
            )
            db.add(submission)
            
            # Update Analytics Table
            self.update_analytics(db, int(student_id), assessment["course_id"], source, final_score)
            
            db.commit()
            
            # Check for Chapter Completion/Unlock
            if source == "chapter_exercise" and final_score >= 60:
                 from app.features.progress.service import progress_service
                 if "chapter_index" in assessment:
                     progress_service.mark_chapter_complete(int(student_id), assessment["course_id"], assessment["chapter_index"])
        except Exception as e:
            print(f"Submission sync error: {e}")
            db.rollback()
        finally:
            db.close()

        return {
            "status": "success",
            "score": round(final_score, 2),
            "source": source,
            "academic_report": self.get_course_grade(student_id, assessment["course_id"])
        }

    def get_course_grade(self, student_id: str, course_id: str):
        """Calculate final course grade using DB submissions."""
        db = SessionLocal()
        try:
            c_id = int(course_id) if course_id.isdigit() else None
            subs = db.query(AssessmentSubmission).filter_by(
                user_id=int(student_id), 
                course_id=c_id
            ).all()
            
            if not subs: return {"percentage": 0, "grade": "N/A", "status": "No data"}

            # Group by source and type
            data = {
                "exercise": {"mcq": [], "open": []},
                "final": {"mcq": [], "open": []}
            }
            for s in subs:
                # Map source/type to data keys
                src = "exercise" if s.source in ["exercise", "chapter_exercise"] else "final"
                t = "mcq" if s.type == "mcq" or (s.type == "mixed" and any(r.get('type') == 'mcq' for r in json.loads(s.results_json))) else "open"
                # If mixed, we might need more complex logic, but let's stick to the aggregate score per source for now
                data[src][t].append(s.score)
        finally:
            db.close()

        def get_avg(scores): return sum(scores) / len(scores) if scores else 0

        # Assessment Score = MCQ*0.4 + Open*0.6
        exercise_score = calculate_gpa_score(get_avg(data["exercise"]["mcq"]), get_avg(data["exercise"]["open"]))
        final_exam_score = calculate_gpa_score(get_avg(data["final"]["mcq"]), get_avg(data["final"]["open"]))

        # Final = Exercise*0.4 + Final*0.6
        percentage = calculate_gpa_score(exercise_score, final_exam_score)

        # Academic Rules
        status = "Clear"
        if f_open < 40 and data["final"]["open"]: status = "Fail (Final Open-Ended < 40%)"
        elif ex_open < 30 and data["exercise"]["open"]: status = "Remedial Required (Exercise Open-Ended < 30%)"

        gpa, grade = self.percentage_to_gpa(percentage)
        if "Fail" in status: gpa, grade = 0.0, "F"

        return {
            "percentage": round(percentage, 2),
            "grade": grade,
            "gpa": gpa,
            "status": status,
            "breakdown": {
                "exercises": {"score": round(exercise_score, 2), "mcq": round(ex_mcq, 2), "open": round(ex_open, 2)},
                "final_exam": {"score": round(final_exam_score, 2), "mcq": round(f_mcq, 2), "open": round(f_open, 2)}
            }
        }

    def percentage_to_gpa(self, p):
        if p >= 90: return 4.0, "A"
        if p >= 85: return 3.7, "A-"
        if p >= 80: return 3.3, "B+"
        if p >= 75: return 3.0, "B"
        if p >= 70: return 2.7, "B-"
        if p >= 65: return 2.3, "C+"
        if p >= 60: return 2.0, "C"
        if p >= 55: return 1.7, "C-"
        if p >= 50: return 1.0, "D"
        return 0.0, "F"

    def update_analytics(self, db, user_id, course_id, assessment_type, score):
        """Update aggregate course analytics after submission."""
        # Ensure course_id is integer if it's a string from legacy sources
        try:
            c_id = int(course_id) if isinstance(course_id, str) and course_id.isdigit() else int(course_id)
        except:
            c_id = 1 # Fallback or error

        analytics = db.query(CourseAnalytics).filter_by(user_id=user_id, course_id=c_id).first()

        if not analytics:
            analytics = CourseAnalytics(user_id=user_id, course_id=c_id)
            db.add(analytics)

        if assessment_type == "exercise":
            # We average exercises? Or sum? 
            # User snippet says: analytics.exercise_score += score
            # But usually we'd want to track count too for actual average.
            # Implementation plan says: "exercise_score = Column(Float, default=0.0)"
            # Let's follow the user's snippet exactly as requested.
            analytics.exercise_score += score
        elif assessment_type == "final":
            analytics.final_exam_score = score

        analytics.total_score = (analytics.exercise_score + analytics.final_exam_score)
        db.commit()

    # _get_default_assessments removed (Dummy logic elimination)

    def get_random_revision_questions(self, student_id: str, course_id: str, limit: int = 5):
        """Get random questions from previous assessments for revision."""
        db = SessionLocal()
        try:
            c_id = int(course_id) if course_id.isdigit() else None
            user_subs = db.query(AssessmentSubmission).filter_by(
                user_id=int(student_id),
                course_id=c_id
            ).all()
            if not user_subs:
                return []
                
            # Get unique assessment IDs from submissions
            assessment_ids = list(set([s.assessment_id for s in user_subs]))
        finally:
            db.close()
        
        pool = []
        for a_id in assessment_ids:
            a = self.get_assessment(a_id)
            if a:
                if "mcqs" in a:
                    pool.extend([{"question": q["question"], "type": "mcq", "assessment_id": a_id} for q in a["mcqs"]])
                if "open_ended" in a:
                    pool.extend([{"question": q["question"], "type": "open", "assessment_id": a_id} for q in a["open_ended"]])
                    
        if not pool:
            return []
            
        return random.sample(pool, min(len(pool), limit))

assessment_service = AssessmentService()
