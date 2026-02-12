
import sys
import os

# Add app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("Attempting to import app.main...")
try:
    from app.main import app
    print("SUCCESS: app.main imported successfully.")
except Exception as e:
    print(f"FAILURE: Import failed with error: {e}")
    import traceback
    traceback.print_exc()
