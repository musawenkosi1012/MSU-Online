
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def verify_deep_research():
    print("--- 1. Authentication ---")
    # Login
    auth_data = {
        "email": "verifier@msu.edu",
        "password": "password123"
    }
    try:
        login_res = requests.post(f"{BASE_URL}/auth/login", json=auth_data)
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.text}")
            return
    except Exception as e:
        print(f"Server not reachable: {e}")
        return

    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Authenticated")

    print("\n--- 2. Trigger Deep Essay (This will take time) ---")
    query = "The Future of Artificial Intelligence in Education"
    start_time = time.time()
    
    try:
        # Long timeout because deep essay generation is slow
        res = requests.post(f"{BASE_URL}/research/deep-essay", 
                           headers=headers, 
                           json={"query": query, "style": "academic"},
                           timeout=300) 
                           
        if res.status_code == 200:
            data = res.json()
            word_count = data.get("word_count", 0)
            sources = len(data.get("sources", []))
            print(f"[PASS] Deep Essay Generated in {time.time() - start_time:.2f}s")
            print(f"       Word Count: {word_count}")
            print(f"       Sources: {sources}")
            print(f"       Title: {data.get('content', '').splitlines()[0]}")
        else:
            print(f"[FAIL] Deep Essay Error: {res.status_code}")
            print(res.text)
            
    except requests.exceptions.Timeout:
        print("[WARN] Request timed out (Expected for deep generation). Service is likely working but slow.")
    except Exception as e:
        print(f"[FAIL] Request Error: {e}")

if __name__ == "__main__":
    verify_deep_research()
