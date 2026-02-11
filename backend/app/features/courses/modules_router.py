from fastapi import APIRouter, HTTPException
from app.core.curriculum.loader import curriculum_loader

router = APIRouter()

@router.get("/{module_id}/topics")
async def get_module_topics(module_id: str):
    """Get topics for a specific module."""
    module = curriculum_loader.get_module(module_id)
    if not module:
        # DB Search
        from app.core.database import SessionLocal, Module, SubTopic
        from sqlalchemy.orm import joinedload
        db = SessionLocal()
        try:
            db_module = db.query(Module).options(joinedload(Module.sub_topics)).filter(Module.id == module_id).first()
            if db_module:
                module = {
                    "id": db_module.id,
                    "title": db_module.title,
                    "topics": [{
                        "topic_id": s.id,
                        "title": s.title,
                        "type": "content"
                    } for s in db_module.sub_topics]
                }
        finally:
            db.close()
            
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
        
    # Standardize topic data for MusaAIHub
    topics = []
    # In some schemas it's 'topics', in others it might be 'lessons' or flat
    raw_topics = module.get("topics") or module.get("lessons") or []
    for t in raw_topics:
        topics.append({
            "topic_id": t.get("id") or t.get("topic_id"),
            "title": t.get("title"),
            "type": t.get("type", "content")
        })
        
    return {"tiles": topics}
