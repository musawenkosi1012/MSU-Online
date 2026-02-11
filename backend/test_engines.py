import requests
from bs4 import BeautifulSoup

def test_search(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
    }
    try:
        print(f"Testing URL: {url}")
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            soup = BeautifulSoup(resp.text, 'html.parser')
            # Look for all links
            links = soup.find_all('a')
            print(f"Found {len(links)} links")
            # Print classes of first 10 links
            for i, link in enumerate(links[:20]):
                classes = link.get('class', [])
                text = link.get_text().strip()[:20]
                if classes:
                    print(f"  Link {i}: Class={classes}, Text={text}")
        return resp.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    # Test DDG HTML
    test_search("https://html.duckduckgo.com/html/?q=test")
    # Test Google
    test_search("https://www.google.com/search?q=test")
    # Test Bing
    test_search("https://www.bing.com/search?q=test")
