from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.agents.coordinator import coordinator
from app.features.auth.utils import get_current_user

router = APIRouter(prefix="/api/agents", tags=["Agents"])

@router.post("/run")
async def run_agent(payload: Dict[str, Any], current_user: Any = Depends(get_current_user)):
    """
    Unified endpoint for all agentic operations.
    The payload should contain the query and any necessary context.
    """
    try:
        # Add user context to payload
        payload["user_id"] = str(current_user.id)
        
        result = await coordinator.run(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
