import requests
try:
    res = requests.get("http://localhost:8000/api/health")
    print(f"Health Check: {res.status_code}")
except Exception as e:
    print(f"Health Check Failed: {e}")
