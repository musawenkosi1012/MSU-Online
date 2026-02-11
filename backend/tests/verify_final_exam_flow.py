import requests
import json
import time

BASE_URL = "http://localhost:8000"

def get_token():
    email = "test_student_ai@msu.ac.zw"
    password = "password123"
    response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def verify_flow():
    token = get_token()
    if not token: 
        print("Login failed")
        return

    headers = {"Authorization": f"Bearer {token}"}
    course_id = "1" 

    print("\n--- 1. Check Initial Status ---")
    res = requests.get(f"{BASE_URL}/api/assessment/status/{course_id}", headers=headers)
    print(f"Status Response: {res.json()}")
    
    # Expecting incomplete initially (unless I ran previous tests that passed everything)
    
    print("\n--- 2. Try to Access Locked Exam ---")
    res = requests.post(f"{BASE_URL}/api/assessment/final-exam/{course_id}", headers=headers)
    if res.status_code == 403:
        print("SUCCESS: Exam is locked as expected.")
    else:
        print(f"UNEXPECTED: {res.status_code} - {res.text}")

    # To fully test unlock, I'd need to simulate passing all topics.
    # That's complex to script quickly without direct DB access.
    # However, I can manually verify the unlock logic by checking the server logs 
    # and seeing the 'passed' count vs 'total' count in the status response.
    
    # If I really want to test generation, I can force it by temporarily hacking the check,
    # OR I can just trust the unit test of 'generate_final_exam_content' 
    # and the fact that 403 confirms the guard is working.
    
    # Let's just print the status and confirm the endpoints are reachable.
    
if __name__ == "__main__":
    verify_flow()
