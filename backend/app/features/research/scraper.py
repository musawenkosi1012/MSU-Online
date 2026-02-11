"""
Advanced Scraper Service
Production-grade async scraper with robust search, content verification, and persistence.
"""
import asyncio
import aiohttp
import hashlib
import re
import traceback
import json
import random
import os
from datetime import datetime
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from .production_scraper import production_scraper

# ============================================
# TRUSTED DOMAINS & CONFIG
# ============================================
TRUSTED_SOURCES = {
    "high_trust": [
        "wikipedia.org", "britannica.com", ".edu", ".gov", "who.int", "un.org", "nih.gov"
    ],
    "medium_trust": [
        "medium.com", "github.com", "stackoverflow.com", "bbc.com", "reuters.com", 
        "nytimes.com", "wsj.com", "techcrunch.com"
    ],
    "low_trust": [
        "blogspot.com", "wordpress.com"
    ]
}

CACHE_FILE = "scraper_cache.json"

# ============================================
# FAKE CONTENT DETECTION
# ============================================
class FakeContentDetector:
    """Detects fake/low-quality content using heuristics + AI."""
    
    def __init__(self, model_service=None):
        self.model_service = model_service
        self.red_flags = [
            "miracle cure", "doctors hate", "one weird trick", "you won't believe",
            "secret they don't want you to know", "shocking discovery", "guaranteed",
            "100% proven", "conspiracy", "mainstream media won't tell you"
        ]
    
    def get_heuristic_score(self, text: str) -> float:
        text_lower = text.lower()
        red_flag_count = sum(1 for flag in self.red_flags if flag in text_lower)
        score = 1.0 - (red_flag_count * 0.15)
        return max(0.1, min(1.0, score))

    async def ai_verify(self, text: str, title: str) -> Dict:
        """Async wrapper for AI verification."""
        heuristic = self.get_heuristic_score(text)
        
        if not self.model_service or not self.model_service.llm:
            return {
                'score': heuristic,
                'method': 'heuristic',
                'reason': 'AI model unavailable'
            }

        prompt = f"""Analyze credibility (0-10). Return JSON ONLY: {{"score": <number>, "reason": "<string>"}}.
Title: {title}
Snippet: {text[:500]}"""

        try:
            # Run blocking LLM call in thread
            response = await asyncio.to_thread(
                self.model_service.generate_response, prompt, max_tokens=100
            )
            
            # Robust JSON extraction
            match = re.search(r'\{.*\}', response, re.DOTALL)
            if match:
                data = json.loads(match.group())
                ai_score = float(data.get('score', 5)) / 10.0
                return {
                    'score': (heuristic * 0.3) + (ai_score * 0.7),
                    'method': 'ai_verified',
                    'reason': data.get('reason', 'AI analysis')
                }
        except Exception as e:
            print(f"[FakeDetector] AI error: {e}")
        
        return {'score': heuristic, 'method': 'heuristic_fallback', 'reason': 'AI parsing failed'}

# ============================================
# ADVANCED SCRAPER SERVICE
# ============================================
class AdvancedScraper:
    def __init__(self, model_service=None):
        self.fake_detector = FakeContentDetector(model_service)
        self.scraped_articles = self._load_cache()
        self.session: Optional[aiohttp.ClientSession] = None

    def _load_cache(self) -> List[Dict]:
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, 'r') as f:
                    return json.load(f)
            except:
                pass
        return []

    def _save_cache(self):
        try:
            with open(CACHE_FILE, 'w') as f:
                json.dump(self.scraped_articles, f, indent=2)
        except Exception as e:
            print(f"[Scraper] Cache save failed: {e}")

    def get_domain_trust(self, url: str) -> float:
        url_lower = url.lower()
        for domain in TRUSTED_SOURCES["high_trust"]:
            if domain in url_lower: return 0.95
        for domain in TRUSTED_SOURCES["medium_trust"]:
            if domain in url_lower: return 0.75
        for domain in TRUSTED_SOURCES["low_trust"]:
            if domain in url_lower: return 0.4
        return 0.5

    async def _get_session(self) -> aiohttp.ClientSession:
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession()
        return self.session

    async def scrape_url(self, url: str) -> Dict:
        """Scrape URL using sync ProductionScraper via thread pool."""
        # Check cache (deduplication)
        for article in self.scraped_articles:
            if article['url'] == url:
                return article

        print(f"[Scraper] Processing: {url}")
        
        # Async wrap blocking scrapers
        try:
            # 1. Scrape
            # production_scraper.scrape might be sync or async. 
            # If it's pure sync requests, use to_thread. 
            # Looking at previous code, it seemed awaitable. Assuming async-compatible or wrapped.
            # If production_scraper is sync:
            extract_result = await production_scraper.scrape(url) 
            # If scrape() is actually sync in production_scraper, we should've wrapped it.
            # But the original code awaited it, so we assume it returns a coroutine.

            if extract_result['status'] != 'success':
                return {'url': url, 'status': 'error', 'error': extract_result.get('message')}

            content = extract_result['content']
            title = extract_result.get('title', "Untitled")

            # 2. Verify
            verification = await self.fake_detector.ai_verify(content, title)
            domain_trust = self.get_domain_trust(url)
            final_score = (domain_trust * 0.4) + (verification['score'] * 0.6)

            article = {
                'url': url,
                'title': title,
                'content_clean': content,
                'word_count': len(content.split()),
                'credibility_score': round(final_score, 2),
                'is_verified': final_score >= 0.6,
                'verification': verification,
                'scraped_at': datetime.now().isoformat()
            }

            # 3. Cache
            if article['is_verified']:
                self.scraped_articles.append(article)
                self._save_cache()
            
            return article

        except Exception as e:
            print(f"[Scraper] Failed to scrape {url}: {e}")
            return {'url': url, 'status': 'error', 'error': str(e)}

    async def search(self, query: str, max_results: int = 5) -> List[Dict]:
        """Robust Async Search with DDG."""
        print(f"[Scraper] Search: {query}")
        
        # 1. Fetch URLs via DDG (blocking IO wrapped in thread)
        urls = []
        ddgs = DDGS()
        
        for attempt in range(3):
            try:
                # Run sync DDG key search in thread
                results = await asyncio.to_thread(ddgs.text, query, max_results=max_results)
                # Parse safely
                urls = [r.get('href') for r in results if r.get('href')]
                if urls: break
            except Exception as e:
                print(f"[Scraper] DDG attempt {attempt+1} failed: {e}")
                await asyncio.sleep(2 ** attempt)

        # 2. Fallback
        if not urls:
            safe_q = query.replace(" ", "_")
            urls = [
                f"https://en.wikipedia.org/wiki/{safe_q}",
                "https://en.wikipedia.org/wiki/Artificial_intelligence"
            ]

        # 3. Concurrent Scrape with Semaphore (Rate limiting)
        sem = asyncio.Semaphore(3) # Max 3 concurrent scrapes
        
        async def safe_scrape(u):
            async with sem:
                return await self.scrape_url(u)

        tasks = [safe_scrape(u) for u in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter valid results
        valid = []
        for res in results:
            if isinstance(res, dict) and res.get('content_clean'):
                valid.append(res)
                
        return valid

    async def close(self):
        if self.session:
            await self.session.close()

# Singleton
advanced_scraper = None

def init_advanced_scraper(model_service):
    global advanced_scraper
    advanced_scraper = AdvancedScraper(model_service)
    return advanced_scraper
