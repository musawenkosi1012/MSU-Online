"""
Text Embedder
Generates embeddings using sentence-transformers (BGE-Small or fallback).
"""
import os
from typing import List, Union
import numpy as np
import warnings
import logging

# Suppress transformers and weight loading warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"
logging.getLogger("transformers.modeling_utils").setLevel(logging.ERROR)
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)


class Embedder:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        """
        Initialize embedder.
        
        Args:
            model_name: HuggingFace model name for embeddings
        """
        self.model_name = model_name
        self.model = None
        self.dimension = 384  # BGE-Small dimension
    
    def load_model(self):
        """Lazy load the embedding model."""
        if self.model:
            return True
        
        try:
            from sentence_transformers import SentenceTransformer
            print(f"Loading embedding model: {self.model_name}")
            
            # Use a context manager to catch and ignore the UNEXPECTED position_ids warning
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", message=".*embeddings.position_ids.*")
                warnings.filterwarnings("ignore", category=UserWarning)
                self.model = SentenceTransformer(self.model_name)
                
            self.dimension = self.model.get_sentence_embedding_dimension()
            print(f"Embedding model loaded. Dimension: {self.dimension}")
            return True
        except ImportError:
            print("sentence-transformers not installed. Using fallback embeddings.")
            return False
        except Exception as e:
            print(f"Error loading embedding model: {e}")
            return False
    
    def embed(self, texts: Union[str, List[str]]) -> np.ndarray:
        """
        Generate embeddings for text(s).
        
        Args:
            texts: Single string or list of strings
        
        Returns:
            Numpy array of embeddings
        """
        if isinstance(texts, str):
            texts = [texts]
        
        if not texts:
            return np.array([])
        
        # Try to use sentence-transformers
        if self.load_model() and self.model:
            embeddings = self.model.encode(
                texts,
                normalize_embeddings=True,
                show_progress_bar=False
            )
            return np.array(embeddings)
        
        # Fallback: Simple hash-based embeddings (not semantic, but functional)
        return self._fallback_embed(texts)
    
    def _fallback_embed(self, texts: List[str]) -> np.ndarray:
        """
        Fallback embedding using simple hashing.
        Not semantic, but ensures the system works without sentence-transformers.
        """
        embeddings = []
        for text in texts:
            # Create a deterministic pseudo-embedding
            np.random.seed(hash(text) % (2**32))
            embedding = np.random.randn(self.dimension).astype(np.float32)
            # Normalize
            embedding = embedding / np.linalg.norm(embedding)
            embeddings.append(embedding)
        
        return np.array(embeddings)
    
    def similarity(self, query_embedding: np.ndarray, doc_embeddings: np.ndarray) -> np.ndarray:
        """
        Calculate cosine similarity between query and documents.
        
        Args:
            query_embedding: Single query embedding (1D or 2D with shape [1, dim])
            doc_embeddings: Document embeddings (2D with shape [n, dim])
        
        Returns:
            Array of similarity scores
        """
        if query_embedding.ndim == 1:
            query_embedding = query_embedding.reshape(1, -1)
        
        # Cosine similarity (embeddings are normalized)
        similarities = np.dot(doc_embeddings, query_embedding.T).flatten()
        return similarities


# Singleton instance
embedder = Embedder()
