import requests
import json
import os

BASE_URL = "http://localhost:8000"

def test_linkages():
    print("Starting Linkage Tests...")
    
    # 1. Login
    try:
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "alex_student@msu.edu",
            "password": "student123"
        }, timeout=10)
        if login_res.status_code != 200:
            print(f"❌ Login Failed: {login_res.status_code} {login_res.text}")
            return
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("[OK] Auth Linkage: Success")
    except Exception as e:
        print(f"[ERROR] Auth Linkage: API Unreachable ({e})")
        return

    # 2. Streak
    try:
        streak_res = requests.get(f"{BASE_URL}/api/progress/streak", headers=headers, timeout=10)
        if streak_res.status_code == 200:
            print(f"[OK] Streak Linkage: Success (Streak: {streak_res.json().get('streak')})")
        else:
            print(f"[ERROR] Streak Linkage: Failed ({streak_res.status_code})")
    except Exception as e:
        print(f"[ERROR] Streak Linkage: Error ({e})")

    # 3. Courses
    try:
        courses_res = requests.get(f"{BASE_URL}/api/courses/enrolled", headers=headers, timeout=10)
        if courses_res.status_code == 200:
            print(f"[OK] Courses Linkage: Success ({len(courses_res.json())} courses found)")
        else:
            print(f"[ERROR] Courses Linkage: Failed ({courses_res.status_code})")
    except Exception as e:
        print(f"[ERROR] Courses Linkage: Error ({e})")

    # 4. Coding Lesson
    try:
        lesson_res = requests.get(f"{BASE_URL}/api/coding/lessons/py_loops_01", headers=headers, timeout=10)
        if lesson_res.status_code == 200:
            lesson_data = lesson_res.json()
            if "id" in lesson_data and "spec" in lesson_data:
                print(f"[OK] Coding Lab Linkage: Success (Lesson: {lesson_data.get('title')})")
            else:
                print(f"[ERROR] Coding Lab Linkage: Invalid Data Structure")
        else:
            print(f"[ERROR] Coding Lab Linkage: Failed ({lesson_res.status_code})")
    except Exception as e:
        print(f"[ERROR] Coding Lab Linkage: Error ({e})")

if __name__ == "__main__":
    test_linkages()
