"""
Model Service (Enhanced)
LLM wrapper with structured prompts, RAG integration, and reasoning loops.
"""
import json
import os
from typing import Dict, Any, List, Optional
from threading import Lock
from llama_cpp import Llama

from app.core.rag.retriever import retriever

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# For Render, files are usually in /opt/render/project/src/backend/
# We will look for the model in the project root if backend is subdirectory
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
_DEFAULT_MODEL = os.path.join(_PROJECT_ROOT, "MSU Online.gguf")
MODEL_PATH = os.environ.get("MODEL_PATH", _DEFAULT_MODEL)

# ============================================
# STRUCTURED SYSTEM PROMPTS
# ============================================

SYSTEM_PROMPT = """You are Musa, the EduNexus AI Tutor.

CORE RULES:
- Be helpful, encouraging, and accurate.
- Answer directly without preambles.
- No reasoning or wrapper markers (<thought>, <response>, <speak>, etc.).
- NEVER repeat your own previous answers or sentences within the same response.
- Use provided context where relevant.
"""

CHAT_PROMPT_TEMPLATE = """{system_prompt}

[KNOWLEDGE CONTEXT]
{context}

[STUDENT PROFILE]
Topics: {topics_covered} | Mastery: {mastery_level} | Style: {learning_style}

[SESSION HISTORY]
{conversation_history}

[CURRENT STUDENT QUERY]
{user_input}

[MUSA RESPONSE]
"""

INTERACTIVE_PROMPT_TEMPLATE = """{system_prompt}

[TUTOR STATE: {tutor_state}]
[TOPIC: {topic_title}]

[KNOWLEDGE CONTEXT]
{context}

[STUDENT PROFILE]
Mastery: {mastery}% | Hints: {hints_used}
Learning Style: {learning_style}
Common Mistakes: {common_mistakes}

[CURRENT STUDENT INPUT]
{user_input}

[PEDAGOGICAL INSTRUCTIONS]
{state_instructions}

[MUSA RESPONSE]
"""

STATE_INSTRUCTIONS = {
    "INTRODUCE": "Provide a warm introduction to this topic. Explain what they will learn and why it matters.",
    "EXPLAIN": "Explain the concept clearly. Use analogies and examples. Break down complex ideas step by step.",
    "CHECK_UNDERSTANDING": "Ask a probing question to assess comprehension. Don't give away the answer.",
    "ASSESS": "Present an exercise or question to evaluate understanding. This affects their grade.",
    "UPDATE_MASTERY": "Provide encouraging feedback about their progress based on their performance.",
    "ADVANCE": "Congratulate them and prepare to introduce the next concept.",
    "REMEDIATE": "Provide additional examples and simpler explanations. Be patient and supportive."
}


class ModelService:
    def __init__(self):
        self.llm = None
        self.is_loading = False
        self.lock = Lock()
        print(f"Model service initialized. Model will be loaded on demand from {MODEL_PATH}")

    def load_model(self):
        """Load the model if not already loaded."""
        with self.lock:
            if self.llm:
                return True
                
            if self.is_loading:
                print("Model is already loading...")
                return False
    
            print(f"Activating DeepSeek Reasoning Engine from {MODEL_PATH}...")
            self.is_loading = True
        try:
            # Check for Mock Mode
            if os.environ.get("USE_MOCK_LLM", "false").lower() == "true":
                print("[SYSTEM] Running in MOCK AI Mode")
                self.llm = "MOCK"
                self.is_loading = False
                return True

            # 1. DeepSeek API (OpenAI Compatible)
            deepseek_key = os.environ.get("DEEPSEEK_API_KEY")
            if deepseek_key:
                try:
                    from openai import OpenAI
                    self.openai_client = OpenAI(api_key=deepseek_key, base_url="https://api.deepseek.com")
                    self.openai_model = "deepseek-chat"
                    self.llm = "OPENAI" # Uses same client logic
                    print(f"[SYSTEM] Connected to DeepSeek API")
                    self.is_loading = False
                    return True
                except Exception as e:
                    print(f"[ERROR] Failed to initialize DeepSeek client: {e}")

            # 2. Google Gemini API
            gemini_key = os.environ.get("GEMINI_API_KEY")
            if gemini_key:
                try:
                    import google.generativeai as genai
                    genai.configure(api_key=gemini_key)
                    self.gemini_model = genai.GenerativeModel('gemini-pro')
                    self.llm = "GEMINI"
                    print(f"[SYSTEM] Connected to Google Gemini API")
                    self.is_loading = False
                    return True
                except Exception as e:
                    print(f"[ERROR] Failed to initialize Gemini client: {e}")

            # 3. Anthropic (Claude) API
            anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
            if anthropic_key:
                try:
                    import anthropic
                    self.anthropic_client = anthropic.Anthropic(api_key=anthropic_key)
                    self.anthropic_model = "claude-3-opus-20240229"
                    self.llm = "ANTHROPIC"
                    print(f"[SYSTEM] Connected to Anthropic Claude API")
                    self.is_loading = False
                    return True
                except Exception as e:
                    print(f"[ERROR] Failed to initialize Anthropic client: {e}")

            # 4. Standard/Generic OpenAI API (GPT-4 / OpenRouter / Etc)
            openai_key = os.environ.get("OPENAI_API_KEY")
            if openai_key:
                try:
                    from openai import OpenAI
                    base_url = os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
                    self.openai_client = OpenAI(api_key=openai_key, base_url=base_url)
                    self.openai_model = os.environ.get("OPENAI_MODEL", "gpt-4o")
                    self.llm = "OPENAI"
                    print(f"[SYSTEM] Connected to OpenAI/Compatible API (Model: {self.openai_model})")
                    self.is_loading = False
                    return True
                except Exception as e:
                    print(f"[ERROR] Failed to initialize OpenAI client: {e}")

            # Fallback to Local/Remote GGUF
            import os
            cpu_count = os.cpu_count() or 4
            threads = max(4, cpu_count // 2) if cpu_count > 8 else cpu_count
            
            # Check if file exists
            if not os.path.exists(MODEL_PATH):
                print(f"[WARNING] Model file not found at {MODEL_PATH}. Switching to Mock Mode.")
                self.llm = "MOCK"
                self.is_loading = False
                return True

            self.llm = Llama(
                model_path=MODEL_PATH,
                n_ctx=8192,
                n_threads=threads,
                n_threads_batch=threads,
                n_batch=512,
                n_gpu_layers=0,
                f16_kv=True,
                use_mmap=True,
                verbose=False
            )
            print(f"Reasoning Engine Active with {threads} threads.")
            self.is_loading = False
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            self.llm = None
            self.is_loading = False
            return False

    def unload_model(self):
        """Unload the model to free up resources."""
        with self.lock:
            if self.llm:
                del self.llm
                self.llm = None
                import gc
                gc.collect()
                print("Model unloaded.")
                return True
            return False

    # ============================================
    # RAG-ENHANCED GENERATION
    # ============================================

    def generate_with_rag(self, query: str, course_id: str = None,
                          user_memory: Dict[str, Any] = None,
                          conversation_history: str = "",
                          max_tokens: int = 500) -> Dict[str, Any]:
        """
        Generate response with RAG context injection.
        
        Args:
            query: User query
            course_id: Optional course filter for retrieval
            user_memory: User's long-term memory (topics, mastery, etc.)
            conversation_history: Recent conversation context
            max_tokens: Maximum response tokens
        
        Returns:
            Dict with response, retrieved_context, and confidence
        """
        # Retrieve minimal relevant context for speed
        context = retriever.retrieve_context(query, course_id, max_tokens=500)
        retrieved_chunks = retriever.retrieve(query, course_id)
        
        # Build user memory string
        memory = user_memory or {}
        topics_str = ", ".join(memory.get("topics_covered", [])[:5]) or "None yet"
        mastery_str = f"{memory.get('overall_mastery', 0) * 100:.0f}%"
        learning_style = memory.get("learning_style", "balanced")
        
        # Build prompt
        prompt = CHAT_PROMPT_TEMPLATE.format(
            system_prompt=SYSTEM_PROMPT,
            context=context or "[No retrieved context available]",
            topics_covered=topics_str,
            mastery_level=mastery_str,
            learning_style=learning_style,
            conversation_history=conversation_history or "[No prior conversation]",
            user_input=query
        )
        
        # Generate response
        response = self._generate(prompt, max_tokens)
        
        # Calculate confidence based on retrieval
        confidence = self._calculate_confidence(retrieved_chunks, response)
        
        return {
            "response": response,
            "retrieved_context": [c["text"][:200] + "..." for c in retrieved_chunks[:3]],
            "sources": [c.get("metadata", {}).get("topic_title", "Unknown") for c in retrieved_chunks[:3]],
            "confidence": confidence,
            "rag_enabled": True
        }

    def generate_interactive(self, query: str, tutor_state: str,
                             course_data: Dict[str, Any] = None,
                             user_memory: Dict[str, Any] = None,
                             mastery: float = 0.0, hints_used: int = 0,
                             max_tokens: int = 400) -> Dict[str, Any]:
        """
        Generate response for interactive tutoring mode.
        
        Args:
            query: User input
            tutor_state: Current state machine state
            course_data: Course/topic information
            mastery: Current mastery score
            hints_used: Number of hints used
            max_tokens: Maximum response tokens
        
        Returns:
            Dict with response and state info
        """
        course_data = course_data or {}
        course_id = course_data.get("course_id")
        
        # Retrieve context
        context = retriever.retrieve_context(query, course_id, max_tokens=600)
        
        # Build user memory context
        memory = user_memory or {}
        mistakes_str = ", ".join(memory.get("common_mistakes", [])) or "No persistent patterns detected."
        style = memory.get("learning_style", "balanced")

        # Build prompt
        prompt = INTERACTIVE_PROMPT_TEMPLATE.format(
            system_prompt=SYSTEM_PROMPT,
            tutor_state=tutor_state,
            context=context or "[No retrieved context]",
            course_title=course_data.get("course_title", "Unknown Course"),
            topic_title=course_data.get("topic_title", "Unknown Topic"),
            mastery=int(mastery * 100),
            hints_used=hints_used,
            learning_style=style,
            common_mistakes=mistakes_str,
            user_input=query,
            state_instructions=STATE_INSTRUCTIONS.get(tutor_state, "Respond helpfully.")
        )
        
        response = self._generate(prompt, max_tokens)
        
        return {
            "response": response,
            "tutor_state": tutor_state,
            "rag_enabled": True
        }

    # ============================================
    # TWO-PASS REASONING LOOP (Step 6)
    # ============================================

    def generate_with_reasoning(self, query: str, course_id: str = None,
                                 max_tokens: int = 500) -> Dict[str, Any]:
        """
        Two-pass generation with validation.
        
        Pass 1: Generate initial answer
        Pass 2: Critique and refine
        """
        # Pass 1: Generate answer
        context = retriever.retrieve_context(query, course_id, max_tokens=1500)
        
        first_prompt = f"""{SYSTEM_PROMPT}

[CONTEXT]
{context}

[QUESTION]
{query}

Think step by step and provide a clear, accurate answer:"""
        
        first_answer = self._generate(first_prompt, max_tokens)
        
        # Pass 2: Validate and refine
        validation_prompt = f"""Review this answer for accuracy and completeness:

Question: {query}
Answer: {first_answer}

Context available: {context[:500] if context else "None"}

Validation checklist:
1. Does the answer reference the provided context?
2. Are all claims supported by the material?
3. Is anything fabricated or assumed?
4. Is the explanation clear and complete?

If issues found, provide a corrected answer. If accurate, confirm:"""
        
        validation = self._generate(validation_prompt, max_tokens=300)
        
        # Determine if refinement was needed
        needs_refinement = any(word in validation.lower() for word in 
            ["incorrect", "missing", "fabricated", "inaccurate", "should be"])
        
        final_response = validation if needs_refinement else first_answer
        
        return {
            "response": final_response,
            "first_pass": first_answer,
            "validation": validation,
            "refined": needs_refinement,
            "confidence": 0.9 if not needs_refinement else 0.7
        }

    # ============================================
    # CORE GENERATION
    # ============================================

    def _generate(self, prompt: str, max_tokens: int = 500) -> str:
        """Internal generation method."""
        if not self.llm:
            success = self.load_model()
            if not success:
                return "I'm having trouble loading my AI brain. Please try again."



        # 1. OpenAI / DeepSeek / Generic API
        if self.llm == "OPENAI":
            try:
                # Optimized for GPT-4o, DeepSeek-V3, etc.
                response = self.openai_client.chat.completions.create(
                    model=self.openai_model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=max_tokens,
                    temperature=0.3
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"[AI] OpenAI/DeepSeek Error: {e}")
                return "I'm having trouble connecting to the AI cloud. Please try again."

        # 2. Google Gemini
        if self.llm == "GEMINI":
            try:
                # Gemini Pro Generation
                # Note: Gemini system instructions are usually set at model init, but prompt engineering works too
                full_prompt = f"{SYSTEM_PROMPT}\n\nUser Question: {prompt}"
                response = self.gemini_model.generate_content(
                    full_prompt,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=max_tokens,
                        temperature=0.3
                    )
                )
                return response.text.strip()
            except Exception as e:
                print(f"[AI] Gemini Error: {e}")
                return "I'm having trouble connecting to Google Gemini. Please try again."

        # 3. Anthropic Claude
        if self.llm == "ANTHROPIC":
            try:
                message = self.anthropic_client.messages.create(
                    model=self.anthropic_model,
                    max_tokens=max_tokens,
                    temperature=0.3,
                    system=SYSTEM_PROMPT,
                    messages=[
                        {"role": "user", "content": prompt}
                    ]
                )
                return message.content[0].text.strip()
            except Exception as e:
                print(f"[AI] Claude Error: {e}")
                return "I'm having trouble connecting to Anthropic Claude. Please try again."

        # 4. Check for Remote API (Kaggle/Colab Hosted)
        remote_url = os.environ.get("MUSA_API_URL")
        if remote_url and remote_url.startswith("http"):
            try:
                import requests
                print(f"[AI] Calling Remote Engine: {remote_url}...")
                response = requests.post(f"{remote_url}/generate", json={
                    "prompt": prompt,
                    "max_tokens": max_tokens,
                    "temperature": 0.3,
                    "stop": ["[STUDENT]", "System:", "\n\n\n\n"]
                }, timeout=30) # 30s timeout
                
                if response.status_code == 200:
                    text = response.json().get("text", "").strip()
                    if text: return text
                print(f"[AI] Remote failed: {response.text}. Falling back.")
            except Exception as e:
                print(f"[AI] Remote connection error: {e}. Falling back to Mock/Local.")

        # 2. Handle Mock Mode fallback
        if self.llm == "MOCK" or (not self.llm and not remote_url):
            import time, json
            if not remote_url: time.sleep(1.0) # Simulate delay only if not already waited for network
            
            # Simple keyword-based responses
            lower_prompt = prompt.lower()
            if "hello" in lower_prompt or "hi " in lower_prompt:
                return "Hello! I'm Musa, your AI Tutor. How can I help you with your studies today?"
            elif "grade" in lower_prompt and "json" in lower_prompt:
                return json.dumps({
                    "rubric": {"correctness": 88, "reasoning": 85, "completeness": 90, "clarity": 95},
                    "score": 89,
                    "feedback": "This is a great answer! You covered the main points clearly. (Mock Feedback)"
                })
            elif "exam" in lower_prompt and "json" in lower_prompt:
                return json.dumps({
                    "mcqs": [{"question": "What is Python?", "options": ["Snake", "Language", "Car"], "answer": "Language"} for _ in range(5)],
                    "open_ended": [{"question": "Explain recursion.", "marks": 10} for _ in range(2)],
                    "coding_prompt": "Write a function to add two numbers."
                })
            else:
                return f"This is a simulated AI response. (Remote Engine at {remote_url or 'None'} unavailable). Request: {prompt[:30]}..."

        try:
            print(f"[AI] Generating response for prompt length: {len(prompt)} chars...")
            
            # context management to prevent OOM / Assertions
            with self.lock:
                prompt_tokens = self.llm.tokenize(prompt.encode("utf-8"))
                n_prompt_tokens = len(prompt_tokens)
                n_ctx = self.llm.n_ctx()
                
                # Reserve space for generation
                # If prompt eats up all context, we must truncate the prompt from the beginning (FIFO)
                # or simply fail. For robustness, let's keep the last (n_ctx - max_tokens - safety) tokens.
                
                max_possible_tokens = n_ctx - 20 # Leave a small buffer
                
                if n_prompt_tokens + max_tokens > max_possible_tokens:
                    # Strategy: Preserving instructions is key. Truncate from the middle of the prompt.
                    keep_prefix = 500
                    keep_suffix = max_possible_tokens - max_tokens - keep_prefix
                    
                    if keep_suffix > 0:
                        prefix_tokens = prompt_tokens[:keep_prefix]
                        suffix_tokens = prompt_tokens[-keep_suffix:]
                        prompt_tokens = prefix_tokens + suffix_tokens
                        prompt = self.llm.detokenize(prompt_tokens).decode("utf-8", errors="ignore")
                        print(f"[AI] Truncated middle of prompt. Preserved {keep_prefix} prefix and {keep_suffix} suffix tokens.")
                    else:
                        # Fallback: just keep the end
                        prompt_tokens = prompt_tokens[-(max_possible_tokens - max_tokens):]
                        prompt = self.llm.detokenize(prompt_tokens).decode("utf-8", errors="ignore")
                        print(f"[AI] Truncated prompt to end-only. Context may be lost.")
    
                output = self.llm(
                    prompt,
                    max_tokens=max_tokens,
                stop=["[STUDENT]", "[STUDENT QUERY]", "[STUDENT INPUT]", "System:", "\n\n\n\n"],
                echo=False,
                temperature=0.3,      
                top_p=0.9,
                repeat_penalty=1.2,   # Increased from 1.1 to reduce repetition loops
            )
            
            result = output["choices"][0]["text"].strip()
            
            # Enhanced cleaning for reasoning artifacts
            import re
            
            # 1. Remove hidden reasoning tags and their content (Closed tags)
            hidden_tags = ['thought', 'thinking', 'memory', 'reasoning', 'step-by-step reasoning', 'steps']
            for tag in hidden_tags:
                # Remove content inside tag only if tag is closed
                result = re.sub(f'<{tag}[^>]*>.*?</{tag}>', '', result, flags=re.DOTALL | re.IGNORECASE)
            
            # 2. Strip leftover tag declarations (Just the tags themselves, not the content)
            for tag in hidden_tags:
                result = re.sub(f'<{tag}[^>]*>', '', result, flags=re.IGNORECASE)
                result = re.sub(f'</{tag}[^>]*>', '', result, flags=re.IGNORECASE)
            
            # 3. Strip wrapper tags but keep their content
            wrapper_tags = ['response', 'speak', 'final_answer', 'essay', 'outline', 'MUSA RESPONSE']
            for tag in wrapper_tags:
                result = re.sub(f'<{tag}[^>]*>', '', result, flags=re.IGNORECASE)
                result = re.sub(f'</{tag}[^>]*>', '', result, flags=re.IGNORECASE)
                # Also strip label format [TAG]
                result = re.sub(f'\\[{tag}\\]', '', result, flags=re.IGNORECASE)
            
            # Clean up residual artifacts and weird whitespace
            result = re.sub(r'^\s*[\n\r]+', '', result) 
            result = result.strip()
            
            if not result or len(result) < 5:
                return "I'm here to help with your studies! Feel free to ask me anything about your course material."
            
            return result
            
        except Exception as e:
            print(f"[AI] Generation error: {e}")
            return "I'm having trouble generating a response. Please try again."

    def _calculate_confidence(self, retrieved_chunks: List[Dict], response: str) -> float:
        """Calculate confidence score based on retrieval quality."""
        if not retrieved_chunks:
            return 0.3  # Low confidence without context
        
        # Higher scores = more relevant context
        avg_score = sum(c.get("score", 0) for c in retrieved_chunks) / len(retrieved_chunks)
        
        # Scale to 0.5-0.95 range
        confidence = 0.5 + (avg_score * 0.45)
        return round(min(0.95, confidence), 2)

    # ============================================
    # GRADING (Enhanced with RAG)
    # ============================================

    def grade_essay(self, question: str, answer: str, reference: str = "", 
                    topic_id: str = None) -> Dict[str, Any]:
        """Grade an essay response with RAG-enhanced reference material."""
        if not self.llm:
            success = self.load_model()
            if not success:
                return {
                    "score": 75, 
                    "rubric": {"correctness": 70, "reasoning": 75, "completeness": 80, "clarity": 75}, 
                    "feedback": "AI model unavailable."
                }

        # Get additional context from RAG
        rag_reference = ""
        if topic_id:
            rag_reference = retriever.retrieve_context(question, max_tokens=1000)

        combined_reference = f"{reference}\n\n{rag_reference}".strip()

        prompt = f"""You are Musa, the EduNexus AI Tutor. 
Grade the following student response based on four dimensions: Correctness (40%), Reasoning (30%), Completeness (20%), and Clarity (10%).

Question: {question}
Reference Material: {combined_reference if combined_reference else "No specific reference provided"}
Student Answer: {answer}

Provide evaluation as JSON:
{{
  "rubric": {{
    "correctness": 0-100,
    "reasoning": 0-100,
    "completeness": 0-100,
    "clarity": 0-100
  }},
  "feedback": "Specific, constructive academic feedback..."
}}
Only return JSON."""

        try:
            raw = self._generate(prompt, max_tokens=512)
            clean = raw[raw.find('{'):raw.rfind('}')+1]
            data = json.loads(clean)
            
            r = data["rubric"]
            score = (r["correctness"] * 0.40) + \
                    (r["reasoning"] * 0.30) + \
                    (r["completeness"] * 0.20) + \
                    (r["clarity"] * 0.10)
            
            data["score"] = round(score, 2)
            data["rag_enhanced"] = bool(rag_reference)
            return data
        except Exception as e:
            print(f"Grading error: {e}")
            return {
                "score": 70, 
                "rubric": {"correctness": 70, "reasoning": 70, "completeness": 70, "clarity": 70}, 
                "feedback": "Evaluation processed with baseline scores."
            }

    def evaluate_transfer_task(self, scenario: str, solution: str, 
                               constraints: List[str]) -> Dict[str, Any]:
        """Evaluate a transfer task where knowledge is applied in a new context."""
        if not self.llm: 
            self.load_model()
        
        prompt = f"""As Musa, evaluate this student's application of learning in a new context.
Scenario: {scenario}
Constraints: {", ".join(constraints)}
Student Solution: {solution}

Determine if this shows:
1. Memorization (repeating facts)
2. Mastery (adapting principles to the scenario)

Return JSON:
{{
  "mastery_score": 0.0-1.0,
  "feedback": "...",
  "status": "mastery" | "memorization"
}}"""
        try:
            raw = self._generate(prompt, max_tokens=512)
            clean = raw[raw.find('{'):raw.rfind('}')+1]
            return json.loads(clean)
        except Exception as e:
            print(f"Error evaluating mastery: {e}")
            return {"mastery_score": 0.5, "feedback": "Baseline transfer evaluation.", "status": "partial"}

    def generate_assessment_content(self, topic: str, difficulty: str = "Medium", 
                                  assessment_type: str = "quiz") -> Dict[str, Any]:
        """Generate structured assessment content (Quiz or Practical)."""
        if not self.llm: self.load_model()
        
        # Retrieve context for the topic to ensure relevance
        context = retriever.retrieve_context(topic, max_tokens=1000)
        
        if assessment_type == "quiz":
            prompt = f"""Create a {difficulty} level quiz for the topic: "{topic}".
Context: {context[:500] if context else "General knowledge"}

Generate 5 Multiple Choice Questions (MCQs) in strict JSON format:
[
  {{
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correct_index": 0,
    "explanation": "..."
  }},
  ...
]
Only return standard JSON."""
        
        else: # Practical / Open Ended
            prompt = f"""Create a {difficulty} level practical exercise for: "{topic}".
Context: {context[:500] if context else "General knowledge"}

Generate 2 Open-Ended/Practical scenarios in strict JSON format:
[
  {{
    "question": "Scenario description...",
    "rubric": "Criteria for grading...",
    "max_score": 10
  }}
]
Only return standard JSON."""

        try:
            raw = self._generate(prompt, max_tokens=1024)
            start = raw.find('[')
            end = raw.rfind(']') + 1
            return json.loads(raw[start:end])
        except Exception as e:
            print(f"[AI] Assessment failure: {e}")
            return []

    def generate_coding_task(self, topic: str) -> Dict[str, Any]:
        """Generate a single coding sub-topic exercise."""
        if not self.llm: self.load_model()
        prompt = f"""Create a coding exercise for "{topic}". 
Generate JSON:
{{
  "question": "Task description...",
  "starter_code": "...",
  "solution": "...",
  "max_score": 10
}}
Only return JSON."""
        try:
            raw = self._generate(prompt, max_tokens=512)
            start = raw.find('{')
            end = raw.rfind('}') + 1
            return json.loads(raw[start:end])
        except:
            return {"question": f"Write a program for {topic}", "starter_code": "", "max_score": 10}

    def generate_chapter_assessment(self, chapter_title: str) -> Dict[str, Any]:
        """Generate learning hub chapter exercise (10 MCQ + 3 Open)."""
        if not self.llm: self.load_model()
        prompt = f"""Create a chapter-end assessment for "{chapter_title}".
Generate 10 MCQs and 3 Open-Ended questions in strict JSON:
{{
  "mcqs": [...],
  "open_ended": [...]
}}
Only return JSON."""
        try:
            raw = self._generate(prompt, max_tokens=2048)
            start = raw.find('{')
            end = raw.rfind('}') + 1
            return json.loads(raw[start:end])
        except:
            return {"mcqs": [], "open_ended": []}

    def grade_code(self, prompt: str, code: str) -> Dict[str, Any]:
        """Grade a coding task submission."""
        if not self.llm: self.load_model()
        prompt = f"""Grade this code submission for the task: {prompt}
Code:
{code}
Return JSON: {{"score": 0-100, "feedback": "..."}}"""
        try:
            raw = self._generate(prompt, max_tokens=512)
            start = raw.find('{')
            end = raw.rfind('}') + 1
            return json.loads(raw[start:end])
        except:
            return {"score": 50, "feedback": "Auto-graded."}

    def generate_final_exam_content(self, course_title: str, topics: List[str]) -> Dict[str, Any]:
        """Generate comprehensive final exam according to specific rules."""
        if not self.llm: self.load_model()
        
        topics_str = ", ".join(topics[:20])
        
        prompt = f"""Create a Final Exam for "{course_title}".
Requirements:
1. 20 Multiple Choice Questions (1 mark each).
2. 4 Essay/Open-Ended Questions (20 marks each).
3. If this is a programming course, also include 1 Coding Task (10 marks).

Generate JSON:
{{
  "mcqs": [...], 
  "open_ended": [...],
  "coding_prompt": "Optional coding task prompt"
}}
Only return JSON."""

        try:
            raw = self._generate(prompt, max_tokens=2048)
            start = raw.find('{')
            end = raw.rfind('}') + 1
            return json.loads(raw[start:end])
        except Exception as e:
            print(f"[AI] Final Exam failed: {e}")
            return {"mcqs": [], "open_ended": []}

    # ============================================
    # LEGACY COMPATIBILITY
    # ============================================

    def generate_response(self, prompt: str, max_tokens: int = 150) -> str:
        """Legacy method for backward compatibility."""
        return self._generate(prompt, max_tokens)


# Singleton instance
model_service = ModelService()
