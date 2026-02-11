"""
EduNexus Backend API
Refactored modular architecture with feature-based routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title="EduNexus AI Tutor API",
        description="Modular AI-powered learning platform",
        version="2.0.0"
    )

    # CORS for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check
    @app.get("/health")
    def health_check():
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

    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
