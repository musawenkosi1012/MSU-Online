"""
Text Embedder
Generates embeddings using OpenAI (text-embedding-3-small) or sentence-transformers (BGE-Small).
"""
import os
from typing import List, Union
import numpy as np

class Embedder:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name
        self.model = None
        self.openai_client = None
        self.dimension = 384  # Default BGE dimension, will update if OpenAI used

    def get_openai_client(self):
        """Lazy load OpenAI client."""
        if self.openai_client: return self.openai_client
        api_key = os.environ.get("OPENAI_API_KEY")
        if api_key:
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=api_key)
                self.dimension = 1536 # text-embedding-3-small dimension
                print("[EMBED] Using OpenAI Embeddings (dimension: 1536)")
                return self.openai_client
            except Exception as e:
                print(f"[EMBED] Failed to init OpenAI: {e}")
        return None

    def embed(self, texts: Union[str, List[str]]) -> np.ndarray:
        if isinstance(texts, str): texts = [texts]
        if not texts: return np.array([])
        
        # 1. Try OpenAI Embeddings
        client = self.get_openai_client()
        if client:
            try:
                # Replace newlines
                texts = [t.replace("\n", " ") for t in texts]
                response = client.embeddings.create(input=texts, model="text-embedding-3-small")
                embeddings = [data.embedding for data in response.data]
                return np.array(embeddings)
            except Exception as e:
                print(f"[EMBED] OpenAI embedding failed: {e}. Falling back to local.")

        # 2. Try Sentence Transformers (Local BGE)
        try:
            from sentence_transformers import SentenceTransformer
            if not self.model:
                self.model = SentenceTransformer(self.model_name)
                self.dimension = self.model.get_sentence_embedding_dimension()
            return self.model.encode(texts, normalize_embeddings=True)
        except Exception as e:
            # 3. Fallback: Fake embeddings
            print(f"[EMBED] Local embedding failed: {e}. Using random fallback.")
            return self._fallback_embed(texts)

    def _fallback_embed(self, texts: List[str]) -> np.ndarray:
        embeddings = []
        for text in texts:
            np.random.seed(hash(text) % (2**32))
            emb = np.random.randn(self.dimension).astype(np.float32)
            emb = emb / np.linalg.norm(emb)
            embeddings.append(emb)
        return np.array(embeddings)

    def similarity(self, query_embedding: np.ndarray, doc_embeddings: np.ndarray) -> np.ndarray:
        if query_embedding.ndim == 1:
            query_embedding = query_embedding.reshape(1, -1)
        return np.dot(doc_embeddings, query_embedding.T).flatten()

embedder = Embedder()
