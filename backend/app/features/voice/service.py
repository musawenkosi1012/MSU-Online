"""
Voice AI Tutor Service
- Conversation memory (multi-turn)
- Natural tutor personality
- MSU AI response filtering
- Optimized for voice interaction
"""

from datetime import datetime
from typing import List, Dict, Optional
import re

# ============================================
# CONVERSATION MEMORY
# ============================================

class ConversationMemory:
    """Manages multi-turn conversation history for voice interactions."""
    
    def __init__(self, max_turns: int = 10):
        self.max_turns = max_turns
        self.sessions: Dict[str, List[Dict]] = {}
    
    def get_session(self, session_id: str) -> List[Dict]:
        """Get or create a conversation session."""
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        return self.sessions[session_id]
    
    def add_message(self, session_id: str, role: str, content: str):
        """Add a message to the conversation."""
        session = self.get_session(session_id)
        session.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep only last N turns
        if len(session) > self.max_turns * 2:
            self.sessions[session_id] = session[-(self.max_turns * 2):]
    
    def get_context(self, session_id: str) -> str:
        """Build conversation context for LLM."""
        session = self.get_session(session_id)
        context_parts = []
        for msg in session:
            role = "Student" if msg["role"] == "user" else "Tutor"
            context_parts.append(f"{role}: {msg['content']}")
        return "\n".join(context_parts)
    
    def clear_session(self, session_id: str):
        """Clear a conversation session."""
        if session_id in self.sessions:
            del self.sessions[session_id]

# ============================================
# TUTOR PERSONALITY
# ============================================

TUTOR_SYSTEM_PROMPT = """You are a friendly, patient AI tutor named "Mbuya" (meaning grandmother/wise elder in Shona).
You help students learn with warmth, encouragement, and clarity.

Guidelines:
- Speak naturally, like a real tutor would
- Use simple, clear explanations
- Break complex topics into small steps
- Encourage the student with positive reinforcement
- Ask follow-up questions to check understanding
- Keep responses concise (2-3 sentences for voice)
- Use examples from everyday life when possible
- If you don't know something, say so honestly

Avoid:
- Long paragraphs (this is for voice, be concise)
- Technical jargon without explanation
- Making up facts

You can speak English, Shona, and Ndebele. Respond in the language the student uses."""

# ============================================
# RESPONSE FILTERING
# ============================================

class ResponseFilter:
    """Filter AI responses for accuracy and appropriateness."""
    
    def __init__(self):
        # Red flags that indicate potentially wrong info
        self.uncertainty_phrases = [
            "i think", "probably", "maybe", "not sure", "i believe",
            "it might be", "could be"
        ]
        
        # Topics that need extra care
        self.sensitive_topics = [
            "medical advice", "legal advice", "financial advice",
            "diagnosis", "treatment", "medication"
        ]
    
    def check_response(self, response: str) -> Dict:
        """Check response for potential issues."""
        response_lower = response.lower()
        
        # Check for uncertainty
        uncertainty_score = sum(1 for phrase in self.uncertainty_phrases if phrase in response_lower)
        
        # Check for sensitive topics
        has_sensitive = any(topic in response_lower for topic in self.sensitive_topics)
        
        # Calculate confidence
        confidence = 1.0 - (uncertainty_score * 0.15)
        confidence = max(0.3, min(1.0, confidence))
        
        return {
            "is_safe": confidence > 0.5 and not has_sensitive,
            "confidence": round(confidence, 2),
            "needs_disclaimer": has_sensitive,
            "uncertainty_count": uncertainty_score
        }
    
    def add_disclaimer(self, response: str) -> str:
        """Add disclaimer if needed."""
        return f"{response}\n\n(Note: For professional advice, please consult a qualified expert.)"

# ============================================
# VOICE TUTOR SERVICE
# ============================================

class VoiceService:
    """Main service for voice-based AI tutoring and speech processing."""
    
    def __init__(self, model_service=None):
        self.model_service = model_service
        self.memory = ConversationMemory(max_turns=10)
        self.filter = ResponseFilter()
    
    def process_voice_input(self, session_id: str, user_text: str) -> Dict:
        """Process user's voice input (already transcribed) and generate response."""
        
        # Add user message to memory
        self.memory.add_message(session_id, "user", user_text)
        
        # Build context
        context = self.memory.get_context(session_id)
        
        # Build prompt for LLM
        prompt = f"""{TUTOR_SYSTEM_PROMPT}

Conversation so far:
{context}

Tutor:"""
        
        # Generate response
        if self.model_service and self.model_service.llm:
            response = self.model_service.generate_response(prompt, max_tokens=150)
        else:
            # Fallback response
            response = self._get_fallback_response(user_text)
        
        # Clean response for voice
        response = self._clean_for_voice(response)
        
        # Filter response
        filter_result = self.filter.check_response(response)
        
        if filter_result["needs_disclaimer"]:
            response = self.filter.add_disclaimer(response)
        
        # Add assistant response to memory
        self.memory.add_message(session_id, "assistant", response)
        
        return {
            "text": response,
            "session_id": session_id,
            "confidence": filter_result["confidence"],
            "is_safe": filter_result["is_safe"],
            "turn_count": len(self.memory.get_session(session_id)) // 2
        }
    
    def _clean_for_voice(self, text: str) -> str:
        """Clean text for natural voice output."""
        # Remove markdown formatting
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)  # Bold
        text = re.sub(r'\*([^*]+)\*', r'\1', text)      # Italic
        text = re.sub(r'`([^`]+)`', r'\1', text)        # Code
        text = re.sub(r'#{1,6}\s*', '', text)           # Headers
        text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)  # Links
        
        # Clean up whitespace
        text = re.sub(r'\n+', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        # Limit length for voice (about 30 seconds of speech)
        words = text.split()
        if len(words) > 80:
            text = ' '.join(words[:80]) + "..."
        
        return text
    
        return "I hear you. Tell me more about what you'd like to learn, and I'll do my best to help explain it."
    
    def text_to_speech(self, text: str, voice: str = "default") -> Dict:
        """Convert text to speech using OpenAI API."""
        try:
            openai_key = os.environ.get("OPENAI_API_KEY")
            if not openai_key:
                return {
                    "status": "error",
                    "message": "OpenAI API key not found. Please use browser speech synthesis."
                }
            
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            
            # Map voices
            voice_map = {
                "p225": "alloy",
                "p226": "nova",
                "p227": "onyx",
                "default": "shimmer"
            }
            target_voice = voice_map.get(voice, "shimmer")

            output_path = f"data/voice/tts_{hash(text)}.mp3"
            os.makedirs("data/voice", exist_ok=True)
            
            response = client.audio.speech.create(
                model="tts-1",
                voice=target_voice,
                input=text
            )
            response.stream_to_file(output_path)
            
            return {
                "status": "success",
                "text": text,
                "audio_url": f"/api/voice/stream/{os.path.basename(output_path)}"
            }
        except Exception as e:
            print(f"TTS Error: {e}")
            return {"status": "error", "message": "API Speech failed. Use browser default."}

    def speech_to_text(self, audio_file_path: str) -> Dict:
        """Convert speech to text using OpenAI Whisper API."""
        try:
            openai_key = os.environ.get("OPENAI_API_KEY")
            if not openai_key:
                return {"status": "error", "message": "API key not found."}
            
            from openai import OpenAI
            client = OpenAI(api_key=openai_key)
            
            with open(audio_file_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1", 
                    file=audio_file
                )
            
            return {
                "status": "success",
                "text": transcript.text
            }
        except Exception as e:
            print(f"STT Error: {e}")
            return {"status": "error", "message": str(e)}

    def get_voices(self) -> List[Dict]:
        """Get available cloud voices."""
        return [
            {"id": "p225", "name": "Prof. Musa (Clear)"},
            {"id": "p226", "name": "Mbuya (Warm)"},
            {"id": "p227", "name": "Sekuru (Authoritative)"}
        ]
    
    def get_greeting(self, session_id: str) -> str:
        """Get a greeting for new sessions."""
        greetings = [
            "Hello! I'm Mbuya, your AI tutor. What would you like to learn about today?",
            "Makadiiko! Welcome back. I'm here to help with your studies. What topic shall we explore?",
            "Hi there! Ready to learn something new? I'm here to guide you.",
        ]
        import random
        return random.choice(greetings)
    
    def get_session_history(self, session_id: str) -> List[Dict]:
        """Get the full conversation history for a session."""
        return self.memory.get_session(session_id)
    
    def clear_session(self, session_id: str):
        """Clear a session's history."""
        self.memory.clear_session(session_id)

# Singleton instance
voice_service = VoiceService()

def init_voice_service(model_service_inst):
    global voice_service
    voice_service.model_service = model_service_inst
    return voice_service
