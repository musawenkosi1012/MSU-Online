import requests
import json

BASE_URL = "http://localhost:8000"

def test_tutor_flow():
    # 1. Login
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

    # 2. Add Material Link
    link_url = f"{BASE_URL}/api/tutor/materials/link"
    link_payload = {
        "course_id": 1,
        "title": "Machine Learning Wiki",
        "type": "url",
        "url": "https://en.wikipedia.org/wiki/Machine_learning"
    }
    print(f"Adding material link: {link_payload['url']}...")
    link_resp = requests.post(link_url, json=link_payload, headers=headers)
    
    if link_resp.status_code == 200:
        print("Material link added successfully.")
        print(f"Response: {json.dumps(link_resp.json(), indent=2)}")
        
        # Now we need to check if the content was actually scraped
        # Since we don't have an endpoint to view material content directly easily (it's in DB),
        # we can check the logs or if the material was created with the default message.
        # But wait, main.py adds it to db. We can't see the content here easily unless we add an endpoint or check the DB.
    else:
        print(f"Failed to add material link: {link_resp.status_code}")
        print(f"Error: {link_resp.text}")

if __name__ == "__main__":
    test_tutor_flow()
