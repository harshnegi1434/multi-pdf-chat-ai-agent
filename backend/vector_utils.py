from langchain_google_genai import GoogleGenerativeAIEmbeddings
from ai_utils import get_conversational_chain, get_response_with_retry, get_context_hash
from typing import List, Dict, Any, Optional
from loguru import logger
import time
from functools import lru_cache
import boto3
import json
from langchain.schema import Document

# Global cache for embeddings and responses
_embeddings_cache = None
_response_cache = {}

@lru_cache(maxsize=1)
def get_cached_embeddings():
    """
    Returns a cached instance of the Gemini Pro embedding model.
    Avoids recreating the embedding model for every call.
    """
    global _embeddings_cache
    if _embeddings_cache is None:
        _embeddings_cache = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            task_type="retrieval_document"  # Optimized for document retrieval
        )
        logger.info("Created new embeddings instance")
    return _embeddings_cache

def get_vector_store_optimized(
    text_chunks: List[str],
    store_name: str = "s3vector_index",
    s3_bucket: str = None,
    index_dim: int = 768
) -> None:
    """
    Creates a new S3 Vectors index and uploads all text chunks as vectors.
    - Generates embeddings for each text chunk using Gemini Pro.
    - Uploads vectors in batches to the S3 Vectors index.
    """
    if not text_chunks:
        logger.error("No text chunks provided for vector store creation")
        raise ValueError("Empty text chunks provided")
    start_time = time.time()
    embeddings = get_cached_embeddings()
    try:
        logger.info(f"Generating embeddings for {len(text_chunks)} chunks using Gemini Pro...")
        vectors = []
        for idx, text in enumerate(text_chunks):
            emb = embeddings.embed_query(text)  # Get embedding for each chunk
            if len(emb) != index_dim:
                logger.warning(f"Embedding dimension {len(emb)} does not match index_dim {index_dim}")
            vectors.append({
                "key": f"chunk_{idx}",  # Unique key for each vector
                "data": {"float32": emb},  # Embedding data
                "metadata": {"source_text": text}  # Store original text as metadata
            })
        logger.info(f"Generated {len(vectors)} vectors. Uploading to S3 Vectors...")
        s3vectors = boto3.client("s3vectors")
        batch_size = 500
        # Upload vectors in batches for efficiency
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i+batch_size]
            s3vectors.put_vectors(
                vectorBucketName=s3_bucket,
                indexName=store_name,
                vectors=batch
            )
        processing_time = time.time() - start_time
        logger.info(f"S3 Vectors index '{store_name}' created in bucket '{s3_bucket}' with {len(text_chunks)} chunks in {processing_time:.2f}s")
        return None
    except Exception as e:
        logger.error(f"Error creating S3 Vectors index: {str(e)}")
        raise

def get_vector_store(
    text_chunks: List[str],
    store_name: str = "s3vector_index",
    s3_bucket: str = None
) -> None:
    """
    Wrapper for get_vector_store_optimized for backward compatibility.
    """
    return get_vector_store_optimized(text_chunks, store_name=store_name, s3_bucket=s3_bucket)

def load_vector_store_optimized(
    store_name: str = "s3vector_index",
    s3_bucket: str = None
) -> Optional[list]:
    """
    Loads all vectors and their metadata from an S3 Vectors index.
    Useful for debugging or info, not for search.
    """
    try:
        if not s3_bucket:
            logger.error("S3 bucket not provided for loading S3 Vectors index")
            return None
        s3vectors = boto3.client("s3vectors")
        response = s3vectors.list_vectors(
            vectorBucketName=s3_bucket,
            indexName=store_name
        )
        vectors = response.get("vectors", [])
        logger.info(f"Loaded {len(vectors)} vectors from S3 Vectors index '{store_name}' in bucket '{s3_bucket}'")
        return vectors
    except Exception as e:
        logger.error(f"Error loading S3 Vectors index {store_name}: {str(e)}")
        return None

def similarity_search_optimized(
    question: str,
    store_name: str = "s3vector_index",
    s3_bucket: str = None,
    k: int = 8,
    filter_metadata: dict = None
) -> str:
    """
    Performs a similarity search using S3 Vectors and Gemini Pro embedding.
    - Embeds the question.
    - Queries the S3 Vectors index for the top-k most similar vectors.
    - Optionally filters by metadata.
    - Passes the retrieved texts to the conversational chain for answer generation.
    - Caches responses for repeated queries.
    """
    if not question or not question.strip():
        return "Please provide a valid question."
    cache_key = f"{question.lower().strip()}_{store_name}_{k}"
    if cache_key in _response_cache:
        logger.info("Using cached response")
        return _response_cache[cache_key]
    try:
        embeddings = get_cached_embeddings()
        query_embedding = embeddings.embed_query(question)
        s3vectors = boto3.client("s3vectors")
        query_args = dict(
            vectorBucketName=s3_bucket,
            indexName=store_name,
            queryVector={"float32": query_embedding},
            topK=k,
            returnDistance=True,
            returnMetadata=True
        )
        if filter_metadata:
            query_args["filter"] = filter_metadata
        response = s3vectors.query_vectors(**query_args)
        vectors = response.get("vectors", [])
        if not vectors:
            return "No relevant information found in the uploaded documents."
        # Extract the original text from metadata for each result
        filtered_docs = [
            Document(page_content=v["metadata"].get("source_text", ""), metadata=v.get("metadata", {}))
            for v in vectors if v.get("metadata")
        ]
        if not filtered_docs:
            return "No relevant information found in the uploaded documents."
        # Use the conversational chain to generate a response from the retrieved docs
        chain = get_conversational_chain()
        response_text = get_response_with_retry(chain, filtered_docs, question)
        if len(_response_cache) < 100:
            _response_cache[cache_key] = response_text
        logger.info(f"Generated response using {len(filtered_docs)} S3 Vectors documents")
        return response_text
    except Exception as e:
        logger.error(f"Error in S3 Vectors similarity search: {str(e)}")
        return f"An error occurred while searching the documents: {str(e)}"

def similarity_search_docs(question: str) -> str:
    """
    Wrapper for similarity_search_optimized for backward compatibility.
    """
    return similarity_search_optimized(question)

def clear_caches():
    """
    Clears the response cache to free memory.
    """
    global _response_cache
    _response_cache.clear()
    logger.info("All caches cleared")

def get_vector_store_info(
    store_name: str = "s3vector_index",
    s3_bucket: str = None
) -> dict:
    """
    Gets metadata/info about the S3 Vectors index (e.g., number of vectors).
    """
    try:
        if not s3_bucket:
            return {"error": "S3 bucket not provided"}
        s3vectors = boto3.client("s3vectors")
        response = s3vectors.get_index(
            vectorBucketName=s3_bucket,
            indexName=store_name
        )
        return response
    except Exception as e:
        logger.error(f"Error getting S3 Vectors index info: {str(e)}")
        return {"error": str(e)}

def get_session_index_name(session_id: str) -> str:
    return f"s3vector-index-{session_id}".replace("_", "-")

def create_vector_index(
    store_name: str = "s3vector_index",
    s3_bucket: str = None,
    index_dim: int = 768
) -> None:
    """
    Creates an S3 Vectors index with the specified parameters.
    """
    try:
        if not s3_bucket:
            logger.error("S3 bucket not provided for creating S3 Vectors index")
            return
        s3vectors = boto3.client("s3vectors")
        # Create the index with the specified parameters
        s3vectors.create_index(
            vectorBucketName=s3_bucket,
            indexName=store_name,
            dataType="float32",
            dimension=index_dim,
            distanceMetric="cosine"
        )
        logger.info(f"S3 Vectors index '{store_name}' created in bucket '{s3_bucket}' with dimension {index_dim}")
    except Exception as e:
        logger.error(f"Error creating S3 Vectors index: {str(e)}")
        raise