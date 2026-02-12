"""
Vector Store
ChromaDB wrapper for storing and querying embeddings.
"""
import os
import json
from typing import List, Dict, Any, Optional
import numpy as np

from .embedder import embedder

# Data directory for persistence
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "data", "vector_store")


class VectorStore:
    def __init__(self, collection_name: str = "edunexus_knowledge"):
        """
        Initialize vector store.
        
        Args:
            collection_name: Name of the collection
        """
        self.collection_name = collection_name
        self.client = None
        self.collection = None
        self.use_chroma = False
        
        # Fallback: in-memory store
        self.documents: List[Dict[str, Any]] = []
        self.embeddings: Optional[np.ndarray] = None
        
        # Ensure data directory exists
        os.makedirs(DATA_DIR, exist_ok=True)
        self.fallback_path = os.path.join(DATA_DIR, f"{collection_name}.json")
        
        # Try to load ChromaDB
        self._init_store()
    
    def _init_store(self):
        """Initialize ChromaDB as the primary vector memory."""
        try:
            import chromadb
            from chromadb.config import Settings
            import warnings
            
            # Suppress Chroma/FastEmbed/Transformers warnings during init
            with warnings.catch_warnings():
                warnings.filterwarnings("ignore", message=".*embeddings.position_ids.*")
                
                # Use persistent storage for the knowledge base
                self.client = chromadb.Client(Settings(
                    persist_directory=DATA_DIR,
                    anonymized_telemetry=False,
                    chroma_server_nofile=65536
                ))
                
                # Ensure the collection uses cosine similarity for educational semantic search
                # We set embedding_function=None because we handle embedding manually in this class
                self.collection = self.client.get_or_create_collection(
                    name=self.collection_name,
                    embedding_function=None,
                    metadata={"hnsw:space": "cosine"}
                )
            self.use_chroma = True
            print(f"ChromaDB Knowledge Base Initialized: {self.collection_name}")
        except Exception as e:
            print(f"ChromaDB error: {e}. Falling back to transient JSON memory.")
            self._load_fallback()
    
    def _load_fallback(self):
        """Load fallback store from disk."""
        if os.path.exists(self.fallback_path):
            try:
                with open(self.fallback_path, 'r') as f:
                    data = json.load(f)
                    self.documents = data.get("documents", [])
                    if data.get("embeddings"):
                        self.embeddings = np.array(data["embeddings"])
            except:
                self.documents = []
                self.embeddings = None
    
    def _save_fallback(self):
        """Save fallback store to disk."""
        data = {
            "documents": self.documents,
            "embeddings": self.embeddings.tolist() if self.embeddings is not None else None
        }
        with open(self.fallback_path, 'w') as f:
            json.dump(data, f)
    
    def add(self, texts: List[str], metadatas: List[Dict[str, Any]] = None, ids: List[str] = None):
        """
        Add documents to the store.
        
        Args:
            texts: List of document texts
            metadatas: Optional list of metadata dicts
            ids: Optional list of unique IDs
        """
        if not texts:
            return
        
        # Generate IDs if not provided
        if ids is None:
            import uuid
            ids = [str(uuid.uuid4()) for _ in texts]
        
        if metadatas is None:
            metadatas = [{} for _ in texts]
        
        # Generate embeddings
        embeddings = embedder.embed(texts)
        
        if self.use_chroma and self.collection:
            self.collection.add(
                documents=texts,
                embeddings=embeddings.tolist(),
                metadatas=metadatas,
                ids=ids
            )
        else:
            # Fallback store
            for i, (text, meta, doc_id) in enumerate(zip(texts, metadatas, ids)):
                self.documents.append({
                    "id": doc_id,
                    "text": text,
                    "metadata": meta
                })
            
            # Update embeddings
            if self.embeddings is None:
                self.embeddings = embeddings
            else:
                self.embeddings = np.vstack([self.embeddings, embeddings])
            
            self._save_fallback()
    
    def query(self, query_text: str, n_results: int = 5, 
              where: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Query the vector store.
        
        Args:
            query_text: Query text
            n_results: Number of results to return
            where: Optional metadata filter
        
        Returns:
            List of results with text, metadata, and score
        """
        query_embedding = embedder.embed(query_text)
        
        if self.use_chroma and self.collection:
            results = self.collection.query(
                query_embeddings=query_embedding.tolist(),
                n_results=n_results,
                where=where
            )
            
            # Format results
            formatted = []
            if results["documents"]:
                for i, doc in enumerate(results["documents"][0]):
                    formatted.append({
                        "text": doc,
                        "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                        "score": 1 - results["distances"][0][i] if results["distances"] else 0.0,
                        "id": results["ids"][0][i] if results["ids"] else None
                    })
            return formatted
        else:
            # Fallback query
            if not self.documents or self.embeddings is None:
                return []
            
            # Calculate similarities
            similarities = embedder.similarity(query_embedding, self.embeddings)
            
            # Apply filter if provided
            filtered_indices = list(range(len(self.documents)))
            if where:
                filtered_indices = [
                    i for i, doc in enumerate(self.documents)
                    if all(doc.get("metadata", {}).get(k) == v for k, v in where.items())
                ]
            
            # Get top-k
            if not filtered_indices:
                return []
            
            filtered_scores = [(i, similarities[i]) for i in filtered_indices]
            filtered_scores.sort(key=lambda x: x[1], reverse=True)
            top_k = filtered_scores[:n_results]
            
            results = []
            for idx, score in top_k:
                doc = self.documents[idx]
                results.append({
                    "text": doc["text"],
                    "metadata": doc.get("metadata", {}),
                    "score": float(score),
                    "id": doc["id"]
                })
            
            return results
    
    def count(self) -> int:
        """Get number of documents in store."""
        if self.use_chroma and self.collection:
            return self.collection.count()
        return len(self.documents)
    
    def clear(self):
        """Clear all documents from store."""
        if self.use_chroma and self.collection:
            self.client.delete_collection(self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
        else:
            self.documents = []
            self.embeddings = None
            self._save_fallback()


# Singleton instance
vector_store = VectorStore()
