"""
EduNexus Backend API
Refactored modular architecture with feature-based routers.
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load .env file
load_dotenv()

# Feature routers
from app.features.auth.router import router as auth_router
from app.features.courses.router import router as courses_router
from app.features.courses.modules_router import router as modules_router
from app.features.progress.router import router as progress_router
from app.features.ai_tutor.router import router as ai_tutor_router
from app.features.assessment.router import router as assessment_router
from app.features.research.router import router as research_router
from app.features.textbook.router import router as textbook_router
from app.features.voice.router import router as voice_router
from app.features.notebook_router import router as notebook_router
from app.features.coding.router import router as coding_router
from app.features.tutor.router import router as tutor_router
from app.features.settings.router import router as settings_router

# Initialize voice service with model service
from app.features.voice.service import init_voice_service
from app.shared.model_service import model_service
init_voice_service(model_service)

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse

# Initialize Limiter
limiter = Limiter(key_func=get_remote_address)

def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title="EduNexus AI Tutor API",
        description="Modular AI-powered learning platform",
        version="2.0.0"
    )

    # Rate Limiting configuration
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS configuration - Robust parsing to handle quotes and whitespace
    raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    # Strip leading/trailing quotes often added in .env files
    raw_origins = raw_origins.strip('"').strip("'")
    allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    print(f"[CORS] Allowed Origins: {allowed_origins}")

    # Health check
    @app.get("/health")
    @limiter.limit("20/minute")
    def health_check(request: Request):
        return {"status": "healthy", "version": "2.0.0"}

    # Mount feature routers
    app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
    app.include_router(courses_router, prefix="/api/courses", tags=["Courses"])
    app.include_router(modules_router, prefix="/api/modules", tags=["Modules"])
    app.include_router(progress_router, prefix="/api/progress", tags=["Progress"])
    app.include_router(ai_tutor_router, prefix="/api/ai", tags=["AI Tutor"])
    app.include_router(assessment_router, prefix="/api/assessment", tags=["Assessment"])
    app.include_router(research_router, prefix="/api/research", tags=["Research"])
    app.include_router(textbook_router, prefix="/api/textbook", tags=["Textbook"])
    app.include_router(voice_router, prefix="/api/voice", tags=["Voice"])
    app.include_router(notebook_router, prefix="/api/notes", tags=["Notebook"])
    app.include_router(coding_router, prefix="/api/coding", tags=["Coding"])
    app.include_router(tutor_router, prefix="/api/content", tags=["Tutor Content Management"])
    app.include_router(tutor_router, prefix="/api/tutor", tags=["Tutor Dashboard"], include_in_schema=False)
    app.include_router(settings_router, prefix="/api/settings", tags=["User Settings"])
    
    # Static UI / Agents System
    from app.features.agent_router import router as agent_router
    app.include_router(agent_router)

    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
