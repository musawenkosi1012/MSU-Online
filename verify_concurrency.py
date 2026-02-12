
import sys
import os
import threading
import time

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.shared.model_service import model_service

def run_inference(i):
    print(f"Thread {i} starting...")
    try:
        prompt = f"Thread {i}: valid short prompt. What is 2+2?"
        response = model_service._generate(prompt, max_tokens=10)
        print(f"Thread {i} finished. Response: {response}")
    except Exception as e:
        print(f"Thread {i} CRASHED: {e}")

def test_concurrency():
    print("Testing concurrency with multiple threads...")
    
    # Ensure model is loaded first so we test INFERENCE concurrency, not loading concurrency
    if not model_service.load_model():
        print("Failed to load model")
        return

    threads = []
    for i in range(3):
        t = threading.Thread(target=run_inference, args=(i,))
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join()
    
    print("Concurrency test complete.")

if __name__ == "__main__":
    test_concurrency()
