import requests
import json
import time

BASE_URL = "http://localhost:8000"

def get_token(email, password):
    print(f"Logging in as {email}...")
    res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if res.status_code == 200:
        return res.json()['access_token']
    else:
        print(f"Login failed: {res.text}")
        return None

def run_tests():
    # 1. Login as Tutor
    tutor_token = get_token("tutor@edu.com", "tutor123")
    if not tutor_token: return

    headers_tutor = {"Authorization": f"Bearer {tutor_token}"}

    # 2. Create Course
    print("\nCreating Course...")
    course_data = {"title": "Verification Course 101", "description": "Test for RAG", "total_hours": 10}
    res = requests.post(f"{BASE_URL}/api/tutor/courses", json=course_data, headers=headers_tutor)
    if res.status_code == 200:
        course_id = res.json()['course']['id']
        print(f"Course created: ID {course_id}")
    else:
        print(f"Create course failed: {res.text}")
        return

    # 3. Add Material (PDF) - Mock by sending dummy file content if possible, or just URL
    print("\nAdding URL Material...")
    url_data = {"course_id": course_id, "title": "Wiki Tech", "url": "https://en.wikipedia.org/wiki/Technology"}
    res = requests.post(f"{BASE_URL}/api/tutor/material/url", json=url_data, headers=headers_tutor)
    print(f"Add URL status: {res.status_code}")

    # 4. Add Question
    print("\nAdding Question...")
    q_data = {
        "course_id": course_id,
        "question_text": "What is the primary function of verify_tutor_flow.py?",
        "type": "mcq",
        "difficulty": "easy",
        "options": ["To fail", "To verify backend", "To eat pizza", "None"],
        "correct_answer": "To verify backend"
    }
    res = requests.post(f"{BASE_URL}/api/tutor/questions", json=q_data, headers=headers_tutor)
    print(f"Add Question status: {res.status_code}")

    # 5. Login as Student (seed data: student@msu.edu / password123)
    student_token = get_token("student@msu.edu", "password123")
    if not student_token: return

    headers_student = {"Authorization": f"Bearer {student_token}"}

    # 6. Get Repository
    print(f"\nFetching Repository for Course {course_id}...")
    res = requests.get(f"{BASE_URL}/api/student/repository/{course_id}", headers=headers_student)
    if res.status_code == 200:
        repo = res.json()
        print(f"Repository Materials: {len(repo['materials'])}")
        print(f"Repository Questions: {len(repo['questions'])}")
    else:
        print(f"Fetch Repo failed: {res.text}")

    # 7. Get Exam
    print(f"\nGenerating Exam for Course {course_id}...")
    res = requests.get(f"{BASE_URL}/api/student/exam/{course_id}", headers=headers_student)
    if res.status_code == 200:
        exam = res.json()
        print(f"Exam Questions: {len(exam['exam'])}") # Assuming updated endpoint returns 'exam' key
    else:
        print(f"Fetch Exam failed: {res.text}")

    # 8. Chat RAG
    print("\nTesting Chat RAG...")
    chat_data = {
        "messages": [{"role": "user", "content": "What is this course about?"}],
        "max_tokens": 100
    }
    # Note: Model might load slowly.
    try:
        res = requests.post(f"{BASE_URL}/v1/chat/completions", json=chat_data, headers=headers_student, timeout=60)
        if res.status_code == 200:
            ans = res.json()['choices'][0]['message']['content']
            print(f"AI Response: {ans[:100]}...")
        else:
            print(f"Chat failed: {res.text}")
    except Exception as e:
        print(f"Chat error or timeout: {e}")

if __name__ == "__main__":
    # Wait for server to start if run immediately after starting
    time.sleep(5)
    try:
        run_tests()
    except Exception as e:
        print(f"Test Execution Failed: {e}")
