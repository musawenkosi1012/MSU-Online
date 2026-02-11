"""
Application entry point.
Run from project root: python run.py
"""
import sys
import os

# Add app directory to path for module imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
