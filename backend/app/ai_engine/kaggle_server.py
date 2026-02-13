
"""
Musa AI Engine - Kaggle Deployment Script
This script is designed to run on a Kaggle Notebook or similar GPU environment.
It downloads the GGUF model, starts a FastAPI server, and exposes it via ngrok.
"""

# ==========================================
# 1. SETUP & INSTALLATION (Run in first cell)
# ==========================================
import subprocess
import sys
import os

def install_dependencies():
    packages = [
        "fastapi", "uvicorn", "pydantic", 
        "pyngrok", "nest_asyncio", 
        "llama-cpp-python"  # Ensure GPU support on Kaggle if desired: CMAKE_ARGS="-DGGML_CUDA=on"
    ]
    for package in packages:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])

# Only run installation if not already installed (checked via import attempt)
try:
    import fastapi
    import llama_cpp
except ImportError:
    print("Installing dependencies...")
    install_dependencies()


# ==========================================
# 2. MODEL LOADING
# ==========================================
from llama_cpp import Llama

# Configure Model Path (Assuming uploaded as dataset or downloading)
# If using a Kaggle dataset, path is usually /kaggle/input/dataset-name/file.gguf
MODEL_PATH = "/kaggle/input/msu-online-model/MSU Online.gguf"
if not os.path.exists(MODEL_PATH):
    # Fallback: Download rule or alternative path
    MODEL_PATH = "MSU Online.gguf" 
    if not os.path.exists(MODEL_PATH):
        print(f"WARNING: Model not found at {MODEL_PATH}. Please upload it.")

# Global Model Instance
try:
    llm = Llama(
        model_path=MODEL_PATH,
        n_ctx=8192,
        n_gpu_layers=-1, # Offload all layers to GPU
        verbose=False
    )
    print("Musa AI Engine Loaded Successfully!")
except Exception as e:
    print(f"Failed to load model: {e}")
    llm = None


# ==========================================
# 3. API SERVER
# ==========================================
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import nest_asyncio
from pyngrok import ngrok

app = FastAPI(title="Musa AI Engine")

class GenerationRequest(BaseModel):
    prompt: str
    max_tokens: int = 512
    temperature: float = 0.3
    stop: list = []

@app.get("/health")
def health():
    return {"status": "active", "model_loaded": llm is not None}

@app.post("/generate")
def generate(req: GenerationRequest):
    if not llm:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        output = llm(
            req.prompt,
            max_tokens=req.max_tokens,
            stop=req.stop + ["\n\n\n\n"],
            echo=False,
            temperature=req.temperature
        )
        return {"text": output["choices"][0]["text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# 4. EXPOSURE
# ==========================================

# Set your NGROK Authtoken here (GET IT FROM dashboard.ngrok.com)
NGROK_TOKEN = "YOUR_NGROK_AUTHTOKEN_HERE" 
ngrok.set_auth_token(NGROK_TOKEN)

# Open Tunnel
public_url = ngrok.connect(8000).public_url
print(f"🚀 Musa AI Engine is LIVE at: {public_url}")
print("Copy this URL and set it as MUSA_API_URL in your backend environment variables.")

# Run Server
nest_asyncio.apply()
uvicorn.run(app, port=8000)
