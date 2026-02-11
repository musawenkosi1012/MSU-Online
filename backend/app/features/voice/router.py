"""
Voice Feature Router (Secure & Async Optimized)
Handles TTS, STT, and Voice Chat with robust security and performance.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field, validator
import os
import base64
import uuid
import tempfile
import asyncio
import logging
from typing import Optional
from pathlib import Path
import re

from .service import voice_service
from app.features.auth.service import auth_service
from app.core.database import User

# Configure Logging
logger = logging.getLogger("voice_router")
logger.setLevel(logging.INFO)

router = APIRouter()

# Constants
MAX_AUDIO_SIZE_MB = 10
MAX_TEXT_LENGTH = 1000
ALLOWED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".ogg", ".webm"}
VOICE_DATA_DIR = Path("data/voice")

# Ensure secure storage exists
VOICE_DATA_DIR.mkdir(parents=True, exist_ok=True)

# ----------------------------------------------------
# Request Models
# ----------------------------------------------------

class TTSRequest(BaseModel):
    text: str = Field(..., max_length=MAX_TEXT_LENGTH, description="Text to synthesize")
    voice: str = Field("default", pattern=r"^[a-zA-Z0-9_\-]+$")  # Basic sanitization

    @validator('text')
    def sanitize_text(cls, v):
        # Basic prevention of control characters
        return "".join(ch for ch in v if ch.isprintable())

class STTRequest(BaseModel):
    audio_data: str = Field(..., description="Base64 encoded audio")
    format: str = "wav"

    @validator('audio_data')
    def validate_size(cls, v):
        # Approx check: Base64 size * 0.75 = binary size
        if len(v) * 0.75 > MAX_AUDIO_SIZE_MB * 1024 * 1024:
            raise ValueError(f"Audio payload exceeds {MAX_AUDIO_SIZE_MB}MB limit.")
        return v

class VoiceChatRequest(BaseModel):
    text: str = Field(..., max_length=MAX_TEXT_LENGTH)
    session_id: str = Field(..., min_length=1)

# ----------------------------------------------------
# Helpers
# ----------------------------------------------------

async def cleanup_file(path: Path):
    """Background task to remove temporary files."""
    try:
        if path.exists():
            os.remove(path)
            logger.info(f"Cleaned up file: {path}")
    except Exception as e:
        logger.error(f"Failed to cleanup {path}: {e}")

def validate_filename(filename: str) -> bool:
    """Strict filename validation."""
    # Allow alphanumeric, dashes, underscores, and dots. No paths.
    return bool(re.match(r"^[a-zA-Z0-9_\-\.]+$", filename)) and ".." not in filename

# ----------------------------------------------------
# Endpoints
# ----------------------------------------------------

@router.post("/tts")
async def text_to_speech(
    data: TTSRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """
    Convert text to speech securely.
    Blocking TTS operations are offloaded to a thread pool.
    """
    try:
        # Run blocking TTS in executor
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None, 
            lambda: voice_service.text_to_speech(data.text, data.voice)
        )
        return result
    except Exception as e:
        logger.error(f"TTS Error for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Voice synthesis failed.")

@router.post("/stt")
async def speech_to_text(
    data: STTRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """
    Convert speech to text using temporary file handling.
    Includes automatic cleanup and size validation.
    """
    temp_path = None
    try:
        # Decode base64
        header, encoded = data.audio_data.split(",", 1) if "," in data.audio_data else ("", data.audio_data)
        audio_bytes = base64.b64decode(encoded)

        # Use secure temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{data.format}", dir=VOICE_DATA_DIR) as tmp:
            tmp.write(audio_bytes)
            temp_path = Path(tmp.name)
        
        # Run blocking STT in executor
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: voice_service.speech_to_text(str(temp_path))
        )
        
        return result

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"STT Error for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Speech processing failed.")
    finally:
        # Immediate cleanup attempt
        if temp_path and temp_path.exists():
            try:
                os.remove(temp_path)
            except Exception as cleanup_err:
                logger.warning(f"Immediate cleanup failed for {temp_path}: {cleanup_err}")

@router.post("/chat")
async def voice_chat(
    data: VoiceChatRequest,
    current_user: User = Depends(auth_service.get_current_user)
):
    """
    Handle voice conversation turn.
    Validated length and offloaded processing.
    """
    try:
        # Offload potentially slow LLM/State processing
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: voice_service.process_voice_input(data.session_id, data.text)
        )
        return response
    except Exception as e:
        logger.error(f"Voice Chat Error: {e}")
        raise HTTPException(status_code=500, detail="Conversation processing failed.")

@router.get("/greeting")
async def voice_greeting(
    session_id: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get a welcome greeting for a voice session."""
    try:
        text = voice_service.get_greeting(session_id)
        return {"text": text}
    except Exception as e:
        logger.error(f"Greeting Error: {e}")
        return {"text": "Hello! I am ready to help."}

@router.get("/stream/{filename}")
async def stream_audio(
    filename: str,
    current_user: User = Depends(auth_service.get_current_user) # Authentication Required
):
    """
    Serve generated audio files securely.
    """
    # 1. Validate Filename
    if not validate_filename(filename):
        logger.warning(f"Invalid filename access attempt by user {current_user.id}: {filename}")
        raise HTTPException(status_code=400, detail="Invalid filename.")

    # 2. Construct Safe Path
    file_path = VOICE_DATA_DIR / filename
    
    # 3. Verify Existence
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    # 4. Verify Content Type (Basic extension check)
    ext = file_path.suffix.lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(status_code=403, detail="File type not allowed.")

    return FileResponse(path=file_path, media_type=f"audio/{ext.lstrip('.')}")

@router.get("/voices")
async def get_available_voices(
     current_user: User = Depends(auth_service.get_current_user)
):
    """Get list of available voices."""
    return voice_service.get_voices()
