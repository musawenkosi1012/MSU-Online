"""
Text Chunker
Splits content into 300-600 token chunks for RAG retrieval.
"""
import re
from typing import List, Dict, Any
import tiktoken


class Chunker:
    def __init__(self, chunk_size: int = 400, chunk_overlap: int = 50):
        """
        Initialize chunker.
        
        Args:
            chunk_size: Target tokens per chunk (300-600 range)
            chunk_overlap: Token overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        try:
            self.tokenizer = tiktoken.get_encoding("cl100k_base")
        except:
            self.tokenizer = None
    
    def count_tokens(self, text: str) -> int:
        """Count tokens in text."""
        if self.tokenizer:
            return len(self.tokenizer.encode(text))
        # Fallback: approximate 4 chars per token
        return len(text) // 4
    
    def chunk_text(self, text: str, metadata: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Split text into chunks with metadata.
        
        Args:
            text: Input text to chunk
            metadata: Optional metadata to attach to each chunk
        
        Returns:
            List of chunk dictionaries with text and metadata
        """
        if not text or not text.strip():
            return []
        
        # Clean text
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Split by paragraphs first
        paragraphs = re.split(r'\n\n+', text)
        
        chunks = []
        current_chunk = ""
        current_tokens = 0
        
        for para in paragraphs:
            para_tokens = self.count_tokens(para)
            
            # If paragraph itself exceeds chunk size, split by sentences
            if para_tokens > self.chunk_size:
                sentences = re.split(r'(?<=[.!?])\s+', para)
                for sentence in sentences:
                    sent_tokens = self.count_tokens(sentence)
                    
                    if current_tokens + sent_tokens <= self.chunk_size:
                        current_chunk += " " + sentence
                        current_tokens += sent_tokens
                    else:
                        if current_chunk:
                            chunks.append(self._create_chunk(current_chunk, metadata, len(chunks)))
                        current_chunk = sentence
                        current_tokens = sent_tokens
            
            elif current_tokens + para_tokens <= self.chunk_size:
                current_chunk += "\n\n" + para if current_chunk else para
                current_tokens += para_tokens
            else:
                if current_chunk:
                    chunks.append(self._create_chunk(current_chunk, metadata, len(chunks)))
                current_chunk = para
                current_tokens = para_tokens
        
        # Don't forget the last chunk
        if current_chunk:
            chunks.append(self._create_chunk(current_chunk, metadata, len(chunks)))
        
        return chunks
    
    def _create_chunk(self, text: str, metadata: Dict[str, Any], index: int) -> Dict[str, Any]:
        """Create a chunk dictionary."""
        chunk = {
            "text": text.strip(),
            "tokens": self.count_tokens(text),
            "index": index
        }
        if metadata:
            chunk["metadata"] = metadata
        return chunk
    
    def chunk_course_content(self, course_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Chunk course content from course service format.
        
        Args:
            course_data: Course dictionary with modules and topics
        
        Returns:
            List of chunks with course/topic metadata
        """
        all_chunks = []
        
        course_id = course_data.get("id", "unknown")
        course_title = course_data.get("title", "Unknown Course")
        
        # Chunk course description
        if course_data.get("description"):
            chunks = self.chunk_text(
                course_data["description"],
                metadata={
                    "course_id": course_id,
                    "course_title": course_title,
                    "content_type": "description"
                }
            )
            all_chunks.extend(chunks)
        
        # Chunk modules and topics
        for module in course_data.get("modules", []):
            module_id = module.get("id", "unknown")
            module_title = module.get("title", "Unknown Module")
            
            for topic in module.get("topics", []):
                topic_id = topic.get("id", "unknown")
                topic_title = topic.get("title", "Unknown Topic")
                
                # Create content from learning outcomes
                content = f"Topic: {topic_title}\n\n"
                content += "Learning Outcomes:\n"
                for outcome in topic.get("learning_outcomes", []):
                    content += f"- {outcome}\n"
                
                chunks = self.chunk_text(
                    content,
                    metadata={
                        "course_id": course_id,
                        "course_title": course_title,
                        "module_id": module_id,
                        "module_title": module_title,
                        "topic_id": topic_id,
                        "topic_title": topic_title,
                        "content_type": "topic"
                    }
                )
                all_chunks.extend(chunks)
        
        return all_chunks


# Singleton instance
chunker = Chunker()
