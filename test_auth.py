import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth_flow():
    email = "test@example.com"
    password = "password123"
    name = "Test User"

    print("--- Testing Auth Flow ---")

    # 1. Signup
    print("\n1. Testing POST /api/auth/signup...")
    signup_payload = {
        "full_name": name,
        "email": email,
        "password": password
    }
    resp = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_payload)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 400 and "already registered" in resp.text:
        print("User already exists, proceeding to login.")
    else:
        print(f"Body: {json.dumps(resp.json(), indent=2)}")

    # 2. Login
    print("\n2. Testing POST /api/auth/login...")
    login_payload = {
        "email": email,
        "password": password
    }
    resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
    print(f"Status: {resp.status_code}")
    if resp.status_code != 200:
        print(f"Error: {resp.text}")
        return
    
    data = resp.json()
    token = data["access_token"]
    print(f"Login successful. Token: {token[:20]}...")

    # 3. Get Me (Protected)
    print("\n3. Testing GET /api/auth/me...")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Body: {json.dumps(resp.json(), indent=2)}")

if __name__ == "__main__":
    try:
        test_auth_flow()
    except Exception as e:
        print(f"Error: {e}")
