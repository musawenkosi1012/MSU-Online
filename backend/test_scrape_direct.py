import requests
import json

BASE_URL = "http://localhost:8000"

def test_scrape():
    url = f"{BASE_URL}/api/research/scrape"
    payload = {"topic": "Artificial Intelligence"}
    try:
        print(f"Sending POST request to {url} with topic: 'Artificial Intelligence'...")
        resp = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print("Response Data:")
            print(json.dumps(data, indent=2)[:500] + "...")
        else:
            print(f"Error Response: {resp.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_scrape()
