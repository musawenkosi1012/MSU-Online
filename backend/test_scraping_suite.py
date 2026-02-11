import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_research_scrape(topic, iterations=1):
    print(f"\n--- Testing Research Topic: '{topic}' ({iterations} iterations) ---")
    payload = {"topic": topic}
    for i in range(iterations):
        print(f"Iteration {i+1}...")
        try:
            resp = requests.post(f"{BASE_URL}/api/research/scrape", json=payload)
            if resp.status_code == 200:
                data = resp.json()
                sources = data.get('sources', [])
                summary = data.get('combined_summary', '')
                ai_summary = data.get('ai_summary', '')
                
                print(f"  Status: Success")
                print(f"  Sources Found: {len(sources)}")
                if not sources:
                    print(f"  WARNING: No sources found!")
                    # In main.py, it uses fallback if no sources, so check if it's fallback
                    if data.get('sources') and any(s.get('fallback') for s in data['sources']):
                         print(f"  Notice: Using fallback content")
                
                print(f"  Top Source: {sources[0].get('title') if sources else 'N/A'}")
                print(f"  Summary Length: {len(summary)} chars")
                if ai_summary:
                    print(f"  AI Summary (first 100): {ai_summary[:100]}...")
                else:
                    print(f"  AI Summary: None (Model likely not loaded)")
            else:
                print(f"  Status: Failed ({resp.status_code})")
                print(f"  Error: {resp.text}")
        except Exception as e:
            print(f"  Exception: {e}")
        time.sleep(1)

def test_content_scrape(url, iterations=1):
    print(f"\n--- Testing Content URL: '{url}' ({iterations} iterations) ---")
    payload = {"url": url}
    for i in range(iterations):
        print(f"Iteration {i+1}...")
        try:
            resp = requests.post(f"{BASE_URL}/api/content/scrape", json=payload)
            if resp.status_code == 200:
                data = resp.json()
                status = data.get('status', 'unknown')
                print(f"  Status: {status}")
                
                if status == 'success': # Note: scraper returns 'status' only on error in fetch_url, but success returns article dict directly?
                    # Let's check the structure based on scraper_service.py
                    # It returns the article dict directly on success usually, or error dict
                    pass
                
                # Check for keys in successful response
                if 'title' in data:
                    print(f"  Title: {data.get('title')}")
                    print(f"  Credibility: {data.get('credibility_score')}")
                    print(f"  Verified: {data.get('is_verified')}")
                    print(f"  Word Count: {data.get('word_count')}")
                elif 'error' in data:
                    print(f"  Error: {data.get('error')}")
            else:
                print(f"  HTTP Status: {resp.status_code}")
                print(f"  Response: {resp.text}")
        except Exception as e:
            print(f"  Exception: {e}")
        time.sleep(1)

if __name__ == "__main__":
    print("WARNING: Ensure backend is running! (python main.py)")
    
    # Test 1: Research Topic (Wikipedia/DDG)
    test_research_scrape("Artificial Intelligence in Medicine", iterations=2)
    test_research_scrape("Zimbabwe History", iterations=1)
    
    # Test 2: Content Scrape (URL)
    # Using a reliable wiki URL
    test_content_scrape("https://en.wikipedia.org/wiki/Machine_learning", iterations=2)
    
    # Test 3: Search (if applicable)
