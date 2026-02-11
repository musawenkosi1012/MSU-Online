import requests
import json

BASE_URL = "http://localhost:8000"

def test_get_courses():
    # 1. Login as tutor
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {"email": "tutor@edu.com", "password": "tutor123"}
    print(f"Logging in as tutor...")
    login_resp = requests.post(login_url, json=login_payload)
    if login_resp.status_code != 200:
        print(f"Login failed: {login_resp.text}")
        return
    
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("Login success.")

    # 2. Get courses
    courses_url = f"{BASE_URL}/api/tutor/my-courses"
    print(f"Fetching tutor courses from {courses_url}...")
    resp = requests.get(courses_url, headers=headers)
    
    if resp.status_code == 200:
        print("Success!")
        print(json.dumps(resp.json(), indent=2))
    else:
        print(f"Failed: {resp.status_code}")
        print(resp.text)

if __name__ == "__main__":
    test_get_courses()
