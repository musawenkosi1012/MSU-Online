
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.shared.model_service import model_service

def test_context_overflow():
    print("Initializing model...")
    # Force load
    if not model_service.load_model():
        print("Failed to load model")
        return

    # Create a long prompt
    # Approximating 3 chars per token, 12000 chars ~ 4000 tokens
    long_text = "test " * 7000 
    prompt = f"This is a test prompt with context: {long_text}\n\nUser: Summarize this.\nAI:"
    
    # 7000 * 5 chars = 35000 chars -> ~10000 tokens (conservative estimate: 3 chars/token -> ~11k)
    print(f"Prompt length: {len(prompt)} chars")
    
    try:
        print("Attempting generation that should overflow context...")
        response = model_service._generate(prompt, max_tokens=500)
        print("Generation successful (unexpected if handling is poor)")
        print(f"Response: {response[:100]}...")
    except Exception as e:
        print(f"Caught exception: {e}")

if __name__ == "__main__":
    test_context_overflow()
