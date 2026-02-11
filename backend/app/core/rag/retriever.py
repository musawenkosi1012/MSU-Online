"""
RAG Retriever
Retrieves relevant context for queries using vector store.
"""
from typing import List, Dict, Any, Optional

from .vector_store import vector_store
from .chunker import chunker


class Retriever:
    def __init__(self, top_k: int = 5, min_score: float = 0.3):
        """
        Initialize retriever.
        
        Args:
            top_k: Number of chunks to retrieve
            min_score: Minimum similarity score threshold
        """
        self.top_k = top_k
        self.min_score = min_score
        self.indexed_courses = set()
    
    def index_course(self, course_data: Dict[str, Any]) -> int:
        """
        Index a course into the vector store.
        
        Args:
            course_data: Course dictionary from course service
        
        Returns:
            Number of chunks indexed
        """
        course_id = course_data.get("id", "unknown")
        
        # Check if already indexed
        if course_id in self.indexed_courses:
            print(f"Course {course_id} already indexed.")
            return 0
        
        # Chunk the course content
        chunks = chunker.chunk_course_content(course_data)
        
        if not chunks:
            return 0
        
        # Add to vector store
        texts = [c["text"] for c in chunks]
        metadatas = [c.get("metadata", {}) for c in chunks]
        
        vector_store.add(texts, metadatas)
        self.indexed_courses.add(course_id)
        
        print(f"Indexed {len(chunks)} chunks for course: {course_id}")
        return len(chunks)
    
    def index_text(self, text: str, metadata: Dict[str, Any] = None) -> int:
        """
        Index arbitrary text content.
        
        Args:
            text: Text to chunk and index
            metadata: Optional metadata
        
        Returns:
            Number of chunks indexed
        """
        chunks = chunker.chunk_text(text, metadata)
        
        if not chunks:
            return 0
        
        texts = [c["text"] for c in chunks]
        metadatas = [c.get("metadata", {}) for c in chunks]
        
        vector_store.add(texts, metadatas)
        return len(chunks)
    
    def retrieve(self, query: str, course_id: str = None, 
                 top_k: int = None) -> List[Dict[str, Any]]:
        """
        Retrieve relevant chunks for a query.
        
        Args:
            query: User query
            course_id: Optional filter by course
            top_k: Override default top_k
        
        Returns:
            List of relevant chunks with scores
        """
        k = top_k if top_k else self.top_k
        
        # Build filter
        where = None
        if course_id:
            where = {"course_id": course_id}
        
        # Query vector store
        results = vector_store.query(query, n_results=k, where=where)
        
        # Filter by minimum score
        filtered = [r for r in results if r["score"] >= self.min_score]
        
        return filtered
    
    def retrieve_context(self, query: str, course_id: str = None,
                         max_tokens: int = 2000) -> str:
        """
        Retrieve and format context for prompt injection.
        
        Args:
            query: User query
            course_id: Optional filter by course
            max_tokens: Maximum tokens for context
        
        Returns:
            Formatted context string
        """
        results = self.retrieve(query, course_id)
        
        if not results:
            return ""
        
        context_parts = []
        total_tokens = 0
        
        for i, result in enumerate(results):
            text = result["text"]
            metadata = result.get("metadata", {})
            
            # Estimate tokens (rough: 4 chars per token)
            text_tokens = len(text) // 4
            
            if total_tokens + text_tokens > max_tokens:
                break
            
            # Format with source info
            source = ""
            if metadata.get("topic_title"):
                source = f"[Source: {metadata['topic_title']}]"
            elif metadata.get("course_title"):
                source = f"[Source: {metadata['course_title']}]"
            
            context_parts.append(f"{source}\n{text}")
            total_tokens += text_tokens
        
        return "\n\n---\n\n".join(context_parts)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get retriever statistics."""
        return {
            "indexed_courses": list(self.indexed_courses),
            "total_chunks": vector_store.count(),
            "top_k": self.top_k,
            "min_score": self.min_score
        }


# Singleton instance
retriever = Retriever()
