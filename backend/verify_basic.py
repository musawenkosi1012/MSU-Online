
import sys
import os
import threading
import time

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.shared.model_service import model_service

def simple_test():
    print("Initializing model...")
    try:
        if not model_service.load_model():
            print("Failed to load model")
            return
            
        print("Model loaded. Testing generation...")
        response = model_service._generate("Hello!", max_tokens=10)
        print(f"Generation response: {response}")
    except Exception as e:
        print(f"CRASH: {e}")

if __name__ == "__main__":
    simple_test()
