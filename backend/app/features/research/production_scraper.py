"""
Production Scraper Engine
High-precision web content extraction.
"""
import aiohttp
import asyncio
import re
from typing import Dict
from bs4 import BeautifulSoup

class ProductionScraper:
    async def scrape_wikipedia_api(self, title: str) -> Dict:
        """Fetch Wikipedia content via official API (bypasses 403 blocking)."""
        api_url = "https://en.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "titles": title,
            "prop": "extracts",
            "explaintext": "1",  # Plain text, no HTML
            "format": "json"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    'User-Agent': 'MSUOnlineEducation/1.0 (student@msu.ac.zw) Python/aiohttp'
                }
                async with session.get(api_url, params=params, headers=headers, timeout=15) as response:
                    print(f"[ProductionScraper] Wikipedia API for '{title}' -> status {response.status}")
                    if response.status != 200:
                        return {"status": "error", "message": f"API HTTP {response.status}"}
                    
                    data = await response.json()
                    pages = data.get("query", {}).get("pages", {})
                    
                    for page_id, page_data in pages.items():
                        if page_id == "-1":
                            return {"status": "error", "message": "Page not found"}
                        
                        content = page_data.get("extract", "")
                        title = page_data.get("title", "Untitled")
                        
                        return {
                            "status": "success",
                            "title": title,
                            "content": content,
                            "length": len(content),
                            "source": "wikipedia_api"
                        }
                    
                    return {"status": "error", "message": "No pages returned"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def scrape(self, url: str) -> Dict:
        """High-precision extraction with Wikipedia API fallback."""
        # Check if it's a Wikipedia URL - use API instead
        if "wikipedia.org/wiki/" in url:
            # Extract title from URL
            match = re.search(r'/wiki/([^?#]+)', url)
            if match:
                title = match.group(1).replace('_', ' ')
                return await self.scrape_wikipedia_api(title)
        
        # Regular scraping for non-Wikipedia URLs
        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
                async with session.get(url, headers=headers, timeout=15) as response:
                    print(f"[ProductionScraper] {url} -> status {response.status}")
                    if response.status != 200:
                        return {"status": "error", "message": f"HTTP {response.status}"}
                    
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Basic extraction
                    title = soup.title.string if soup.title else "Untitled"
                    
                    # Remove noise
                    for tag in soup(['script', 'style', 'nav', 'footer', 'header']):
                        tag.decompose()
                        
                    content = soup.get_text(separator='\n', strip=True)
                    
                    return {
                        "status": "success",
                        "title": title,
                        "content": content,
                        "length": len(content),
                        "source": "aiohttp/bs4"
                    }
        except Exception as e:
            return {"status": "error", "message": str(e)}

production_scraper = ProductionScraper()

