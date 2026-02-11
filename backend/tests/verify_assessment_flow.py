import requests
import json
import time

BASE_URL = "http://localhost:8000"

def get_token():
    email = "test_student_ai@msu.ac.zw"
    password = "password123"
    
    # Ensure user exists
    try:
        requests.post(f"{BASE_URL}/api/auth/signup", json={
            "full_name": "Test Student AI",
            "email": email,
            "password": password
        })
    except: pass

    response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    print(f"Login failed: {response.text}")
    return None

def test_assessment_flow():
    token = get_token()
    if not token: return

    headers = {"Authorization": f"Bearer {token}"}
    course_id = "1" # Assuming course 1 exists

    print("\n--- 1. Fetching Assessment Topics ---")
    res = requests.get(f"{BASE_URL}/api/assessment/topics/{course_id}", headers=headers)
    if res.status_code != 200:
        print(f"FAILED to fetch topics: {res.text}")
        return
    
    topics = res.json()["topics"]
    print(f"Found {len(topics)} topics.")
    if not topics:
        print("No topics found. Cannot proceed.")
        return

    # Pick the first pending or ready one
    target = topics[0]
    print(f"Selected target: {target['id']} ({target['title']})")

    print("\n--- 2. Triggering Generation/Fetch ---")
    start_time = time.time()
    res = requests.get(f"{BASE_URL}/api/assessment/{target['id']}", headers=headers)
    print(f"Fetch took {time.time() - start_time:.2f}s")
    
    if res.status_code != 200:
        print(f"FAILED to fetch assessment: {res.text}")
        return

    assessment = res.json()
    questions = assessment.get("questions", [])
    print(f"Got assessment with {len(questions)} questions.")
    
    if not questions:
        print("No questions returned.")
        return

    print("\n--- 3. Submitting Answers ---")
    # Generate dummy answers
    answers = []
    for q in questions:
        if "options" in q:
            answers.append(0) # Select first option
        else:
            answers.append("This is a test answer.")
            
    print(f"Submitting {len(answers)} answers...")
    
    res = requests.post(f"{BASE_URL}/api/assessment/{assessment['id']}/submit", 
                        headers=headers, 
                        json={"answers": answers})
                        
    if res.status_code == 200:
        result = res.json()
        print("Submission SUCCESS!")
        print(f"Score: {result['score']}%")
        print(f"Status: {result.get('status', 'OK')}")
    else:
        print(f"FAILED to submit: {res.text}")

if __name__ == "__main__":
    test_assessment_flow()
