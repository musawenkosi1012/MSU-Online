"""
Research Feature Router
Web scraping and research cache endpoints.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from .scraper import AdvancedScraper
from app.features.auth.service import auth_service
from app.shared.audit import audit_service
from app.core.database import User, get_db

router = APIRouter()

# Initialize scraper (stateless)
scraper = AdvancedScraper()

# Initialize service (lazy load to avoid circular deps if needed, 
# but service.py already handles instantiation)
from .service import research_service
from app.core.database import ResearchResult
import json

class ResearchRequest(BaseModel):
    query: str
    max_results: int = 5

class DeepEssayRequest(BaseModel):
    query: str
    style: str = "academic"


@router.post("/scrape")
async def scrape_research(
    data: ResearchRequest,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Scrape web and persist results."""
    user_id = str(current_user.id)
    
    try:
        results = await scraper.search(data.query, data.max_results)
        
        # Persist to DB
        new_research = ResearchResult(
            user_id=current_user.id,
            query=data.query,
            results_json=json.dumps([r if isinstance(r, dict) else r.__dict__ for r in results])
        )
        db.add(new_research)
        db.commit()
        
        audit_service.log_web_scrape(user_id, data.query, ["web"], True)
        return {"results": results}
    except Exception as e:
        audit_service.log_web_scrape(user_id, data.query, [], False)
        return {"error": str(e), "results": []}


@router.post("/deep-essay")
async def generate_deep_essay(
    data: DeepEssayRequest,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a comprehensive 5000+ word essay."""
    user_id = str(current_user.id)
    return await research_service.generate_deep_essay(user_id, data.query, data.style, db)


@router.get("/cache")
async def get_research_cache(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get persistent research history from DB."""
    history = db.query(ResearchResult)\
        .filter(ResearchResult.user_id == current_user.id)\
        .order_by(ResearchResult.created_at.desc())\
        .limit(10)\
        .all()
    
    # Format for frontend
    cache = []
    for h in history:
        try:
            results = json.loads(h.results_json)
            if results:
                # Just take the first result as a representative for the "card"
                cache.append({
                    "topic": h.query,
                    "title": results[0].get('title', h.query),
                    "url": results[0].get('url', ''),
                    "scraped_at": h.created_at.isoformat()
                })
        except:
            continue
            
    return {"cache": cache}


@router.delete("/cache")
async def clear_research_cache(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Clear research history from DB."""
    db.query(ResearchResult).filter(ResearchResult.user_id == current_user.id).delete()
    db.commit()
    return {"status": "cache_cleared"}
