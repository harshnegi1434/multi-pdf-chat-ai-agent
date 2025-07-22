from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from ai_utils import get_conversational_chain, get_response_with_retry, get_context_hash
from typing import List, Dict, Any, Optional
from loguru import logger

import pickle
import time
from functools import lru_cache
import asyncio
import boto3
import io

# Global embeddings cache
_embeddings_cache = None
_vector_store_cache = {}
_response_cache = {}

@lru_cache(maxsize=1)
def get_cached_embeddings():
    """
    Cache embeddings instance to avoid recreating
    """
    global _embeddings_cache
    if _embeddings_cache is None:
        _embeddings_cache = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            task_type="retrieval_document"  # Optimize for document retrieval
        )
        logger.info("Created new embeddings instance")
    return _embeddings_cache


def get_vector_store_optimized(text_chunks: List[str], store_name: str = "faiss_index", s3_bucket: str = None) -> FAISS:
    """
    Create FAISS vector store and upload directly to S3
    """
    if not text_chunks:
        logger.error("No text chunks provided for vector store creation")
        raise ValueError("Empty text chunks provided")
    start_time = time.time()
    embeddings = get_cached_embeddings()
    try:
        batch_size = 50
        vector_stores = []
        for i in range(0, len(text_chunks), batch_size):
            batch = text_chunks[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1}/{(len(text_chunks)-1)//batch_size + 1}")
            try:
                if i == 0:
                    vector_store = FAISS.from_texts(batch, embedding=embeddings)
                    vector_stores.append(vector_store)
                else:
                    batch_store = FAISS.from_texts(batch, embedding=embeddings)
                    vector_stores[0].merge_from(batch_store)
            except Exception as e:
                logger.error(f"Error processing batch {i//batch_size + 1}: {str(e)}")
                continue
        if vector_stores:
            final_store = vector_stores[0]
            # Serialize FAISS index
            faiss_bytes = final_store.serialize_to_bytes()
            # Upload to S3
            if s3_bucket:
                s3_client = boto3.client("s3")
                s3_key = f"indexes/{store_name}/index.faiss"
                s3_client.put_object(Bucket=s3_bucket, Key=s3_key, Body=faiss_bytes)
                # Save metadata
                metadata = {
                    "chunk_count": len(text_chunks),
                    "creation_time": time.time(),
                    "store_name": store_name
                }
                meta_bytes = pickle.dumps(metadata)
                s3_client.put_object(Bucket=s3_bucket, Key=f"indexes/{store_name}/metadata.pkl", Body=meta_bytes)
                logger.info(f"Vector store uploaded to S3: {s3_key}")
            processing_time = time.time() - start_time
            logger.info(f"Vector store created successfully in {processing_time:.2f}s with {len(text_chunks)} chunks")
            _vector_store_cache[store_name] = final_store
            return final_store
        else:
            raise Exception("Failed to create any vector stores")
    except Exception as e:
        logger.error(f"Error creating vector store: {str(e)}")
        raise

def get_vector_store(text_chunks: List[str]) -> FAISS:
    """
    Backward compatibility wrapper
    """
    return get_vector_store_optimized(text_chunks)


def load_vector_store_optimized(store_name: str = "faiss_index", s3_bucket: str = None) -> Optional[FAISS]:
    """
    Load FAISS vector store directly from S3
    """
    if store_name in _vector_store_cache:
        logger.info(f"Using cached vector store: {store_name}")
        return _vector_store_cache[store_name]
    try:
        if not s3_bucket:
            logger.error("S3 bucket not provided for loading vector store")
            return None
        s3_client = boto3.client("s3")
        s3_key = f"indexes/{store_name}/index.faiss"
        meta_key = f"indexes/{store_name}/metadata.pkl"
        # Download FAISS index
        faiss_obj = s3_client.get_object(Bucket=s3_bucket, Key=s3_key)
        faiss_bytes = faiss_obj["Body"].read()
        embeddings = get_cached_embeddings()
        vector_store = FAISS.deserialize_from_bytes(faiss_bytes, embedding=embeddings)
        # Download metadata
        try:
            meta_obj = s3_client.get_object(Bucket=s3_bucket, Key=meta_key)
            meta_bytes = meta_obj["Body"].read()
            metadata = pickle.loads(meta_bytes)
            logger.info(f"Loaded vector store with {metadata.get('chunk_count', 'unknown')} chunks")
        except Exception:
            pass
        _vector_store_cache[store_name] = vector_store
        logger.info(f"Vector store loaded from S3 and cached: {store_name}")
        return vector_store
    except Exception as e:
        logger.error(f"Error loading vector store {store_name} from S3: {str(e)}")
        return None

def similarity_search_optimized(
    question: str, 
    store_name: str = "faiss_index",
    k: int = 8,
    score_threshold: float = 0.8
) -> str:
    """
    Optimized similarity search with caching and better retrieval
    """
    if not question or not question.strip():
        return "Please provide a valid question."
    
    # Check response cache first
    cache_key = f"{question.lower().strip()}_{store_name}_{k}"
    if cache_key in _response_cache:
        logger.info("Using cached response")
        return _response_cache[cache_key]
    
    try:
        # Load vector store
        db = load_vector_store_optimized(store_name)
        if db is None:
            return "Vector store not found. Please upload documents first."
        
        # Perform similarity search with scores
        docs_with_scores = db.similarity_search_with_score(question, k=k*2)
        # Filter by score threshold and remove chunks that are mostly numbers/whitespace
        import re
        filtered_docs = [
            doc for doc, score in docs_with_scores 
            if score <= score_threshold and not re.match(r'^\s*[\d\s\-\.]+\s*$', doc.page_content)
        ]
        if not filtered_docs:
            # If no good matches, take the best k results anyway
            filtered_docs = [doc for doc, score in docs_with_scores[:k] if not re.match(r'^\s*[\d\s\-\.]+\s*$', doc.page_content)]
        else:
            filtered_docs = filtered_docs[:k]
        if not filtered_docs:
            return "No relevant information found in the uploaded documents."
        # Generate response
        chain = get_conversational_chain()
        response = get_response_with_retry(chain, filtered_docs, question)
        # Cache the response (limit cache size)
        if len(_response_cache) < 100:  # Prevent unlimited cache growth
            _response_cache[cache_key] = response
        
        logger.info(f"Generated response using {len(filtered_docs)} documents")
        return response
        
    except Exception as e:
        logger.error(f"Error in similarity search: {str(e)}")
        return f"An error occurred while searching the documents: {str(e)}"

def similarity_search_docs(question: str) -> str:
    """
    Backward compatibility wrapper
    """
    return similarity_search_optimized(question)

def clear_caches():
    """
    Clear all caches to free memory
    """
    global _vector_store_cache, _response_cache
    _vector_store_cache.clear()
    _response_cache.clear()
    logger.info("All caches cleared")


def get_vector_store_info(store_name: str = "faiss_index", s3_bucket: str = None) -> Dict[str, Any]:
    """
    Get vector store metadata from S3
    """
    try:
        if not s3_bucket:
            return {"error": "S3 bucket not provided"}
        s3_client = boto3.client("s3")
        meta_key = f"indexes/{store_name}/metadata.pkl"
        meta_obj = s3_client.get_object(Bucket=s3_bucket, Key=meta_key)
        meta_bytes = meta_obj["Body"].read()
        metadata = pickle.loads(meta_bytes)
        return metadata
    except Exception as e:
        logger.error(f"Error getting vector store info from S3: {str(e)}")
        return {"error": str(e)}