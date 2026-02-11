from web_scraper import scrape_web_search
import json

def debug_search():
    topic = "fastapi development"
    print(f"Testing scrape_web_search with topic: {topic}")
    results = scrape_web_search(topic)
    print(f"Found {len(results)} results")
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    debug_search()
