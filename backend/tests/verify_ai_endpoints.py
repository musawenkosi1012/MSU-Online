import requests
import json
import sys

BASE_URL = "http://localhost:8000"

# Mock token - in dev/test environment we might need a real token if endpoints are protected.
# The user's frontend logs show Authorization header is used.
# I'll need to login first to get a token, or mock it if the backend allows.
# app/features/auth/router.py has a login endpoint.

def get_token():
    email = "test_student_ai@msu.ac.zw"
    password = "password123"
    
    # 1. Try Signup
    try:
        signup_payload = {
            "full_name": "Test Student AI",
            "email": email,
            "password": password
        }
        requests.post(f"{BASE_URL}/api/auth/signup", json=signup_payload)
        # Used to print result, but we can just proceed to login even if signup fails (e.g. already exists)
    except Exception as e:
        print(f"Signup error (ignoring): {e}")

    # 2. Login
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
        if response.status_code == 200:
            return response.json()["access_token"]
        print(f"Login failed: {response.text}")
        return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_next_topic(token):
    print("\n--- Testing Next Topic Prediction ---")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(f"{BASE_URL}/api/ai/next-topic/course-1", headers=headers)
        if response.status_code == 200:
            print("PASSED: Next topic prediction successful.")
            print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"FAILED: Status {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_chat(token):
    print("\n--- Testing AI Chat ---")
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "message": "Hello Musa",
        "course_id": "course-1",
        "session_id": "test-session"
    }
    try:
        response = requests.post(f"{BASE_URL}/api/ai/chat", json=payload, headers=headers)
        if response.status_code == 200:
            print("PASSED: Chat successful.")
            # print(json.dumps(response.json(), indent=2))
            return True
        else:
            print(f"FAILED: Status {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    token = get_token()
    if not token:
        print("Skipping tests due to login failure. (Ensure server is running and user exists)")
        # Try to run without token if auth is disabled for dev, but it likely isn't.
        # Just fail.
        sys.exit(1)
    
    success = True
    success &= test_next_topic(token)
    success &= test_chat(token)
    
    if success:
        print("\nALL AI TESTS PASSED")
        sys.exit(0)
    else:
        print("\nSOME AI TESTS FAILED")
        sys.exit(1)
