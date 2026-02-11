import asyncio
import json
from production_scraper import production_scraper

async def verify_dynamic_scraping():
    print("=== Production Scraper Verification ===")
    
    # Test 1: Dynamic Site (Generic)
    dynamic_url = "https://www.scrapingcourse.com/javascript-rendering" # Example site for JS testing
    print(f"\n[Test 1] Extracting from dynamic site: {dynamic_url}")
    start_time = asyncio.get_event_loop().time()
    result = await production_scraper.scrape(dynamic_url)
    end_time = asyncio.get_event_loop().time()
    
    if result['status'] == 'success':
        print(f"SUCCESS! Extracted using: {result['source']}")
        print(f"Duration: {end_time - start_time:.2f}s")
        print(f"Content Length: {result['length']}")
        print(f"Preview: {result['content'][:500]}...")
    else:
        print(f"FAILED: {result['message']}")

    # Test 2: Standard Site
    static_url = "https://wikipedia.org/wiki/Artificial_intelligence"
    print(f"\n[Test 2] Extracting from static site: {static_url}")
    result_static = await production_scraper.scrape(static_url)
    if result_static['status'] == 'success':
        print(f"SUCCESS! Extracted using: {result_static['source']}")
        print(f"Content Length: {result_static['length']}")
    else:
        print(f"FAILED: {result_static['message']}")

if __name__ == "__main__":
    asyncio.run(verify_dynamic_scraping())
