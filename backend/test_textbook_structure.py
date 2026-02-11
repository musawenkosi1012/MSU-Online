import requests
import json

BASE_URL = "http://localhost:8000/api/textbook"
COURSE_ID = "1"  # Assuming a course ID 1 exists, or at least we try to update logic

# Mock structure payload
structure_payload = {
    "chapters": [
        {
            "chapter_id": "ch_01",
            "title": "Introduction to AI",
            "intro": "Welcome to the future.",
            "order": 1,
            "sections": [
                {
                    "title": "What is AI?",
                    "content": "AI is ...",
                    "order": 1,
                    "learning_objectives": ["Define AI", "History"],
                    "read_time_minutes": 10
                }
            ],
            "summary": "AI is great."
        }
    ]
}

def test_update_structure():
    # Login to get token first (mocking or using hardcoded if available, but let's try to assume we need a token)
    # For now, let's just try to hit it and see if we get 401 (which means route exists) or 404 (route missing)
    # or 422 (validation error).
    
    # Actually, let's just print the response.
    print(f"Testing PUT {BASE_URL}/{COURSE_ID}/structure")
    try:
        # We need a token. Let's try to login or assume we can skip if auth is disabled for dev (it's not).
        # We'll just check if the endpoint is reachable.
        response = requests.put(f"{BASE_URL}/{COURSE_ID}/structure", json=structure_payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_update_structure()
