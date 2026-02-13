
import requests
import json

BASE_URL = "http://localhost:8000"

def test_get_lesson():
    lesson_id = "py_loops_01"
    url = f"{BASE_URL}/api/coding/lessons/{lesson_id}"
    print(f"Fetching lesson: {url}")
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("Response JSON:")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # Check if backend is running
    try:
        requests.get(BASE_URL)
        test_get_lesson()
    except requests.exceptions.ConnectionError:
        print(f"Backend not running at {BASE_URL}. Please start it.")
