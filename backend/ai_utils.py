from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains.combine_documents.stuff import create_stuff_documents_chain
from typing import List
from loguru import logger
import hashlib
from functools import lru_cache

# Cache for model instances to avoid reinitializing
_model_cache = {}
_chain_cache = {}

def get_text_chunks_optimized(text: str, chunk_size: int = 1500, chunk_overlap: int = 300) -> List[str]:
    """
    Optimized text chunking for better technical content retrieval
    Larger chunks with more overlap for better context preservation
    """
    if not text or not text.strip():
        logger.warning("Empty text provided for chunking")
        return []
    
    # Clean the text first - remove excessive whitespace and page numbers
    import re
    
    # Remove common page number patterns
    text = re.sub(r'\n\s*Page\s+\d+\s*\n', '\n', text, flags=re.IGNORECASE)
    text = re.sub(r'\n\s*\d+\s*\n', '\n', text)  # Remove standalone numbers
    text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
    
    # Use optimized splitters for technical content
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", "! ", "? ", "; ", ": ", " ", ""]
    )
    
    try:
        text_chunks = splitter.split_text(text)
    except Exception as e:
        logger.error(f"Error with text splitter: {str(e)}")
        return []
    
    # Filter and clean chunks
    meaningful_chunks = []
    for chunk in text_chunks:
        cleaned_chunk = chunk.strip()
        # Skip very short chunks or chunks that are mostly numbers/whitespace
        if len(cleaned_chunk) > 100 and not re.match(r'^\s*[\d\s\-\.]+\s*$', cleaned_chunk):
            meaningful_chunks.append(cleaned_chunk)
    
    logger.info(f"Created {len(meaningful_chunks)} meaningful chunks from {len(text)} characters")
    return meaningful_chunks

def get_text_chunks(text: str) -> List[str]:
    """
    Backward compatibility wrapper with optimized defaults
    """
    return get_text_chunks_optimized(text)

@lru_cache(maxsize=1)
def get_cached_model(model_name: str = "gemini-2.0-flash", temperature: float = 0.3):
    """
    Cached model instance to avoid recreating the model repeatedly
    """
    cache_key = f"{model_name}_{temperature}"
    if cache_key not in _model_cache:
        _model_cache[cache_key] = ChatGoogleGenerativeAI(
            model=model_name, 
            temperature=temperature,
            max_tokens=2048,  # Limit response length
            max_retries=3,    # Add retry logic
        )
        logger.info(f"Created new model instance: {cache_key}")
    return _model_cache[cache_key]

@lru_cache(maxsize=1)
def get_conversational_chain():
    """
    Optimized conversational chain with improved prompt for technical content
    """
    chain_key = "default_chain"
    if chain_key not in _chain_cache:
        prompt_template = """
        You are an expert technical assistant specializing in analyzing documents. Answer the user's question based ONLY on the provided context.

        IMPORTANT GUIDELINES:
        1. Answer directly and concisely
        2. Do NOT include page numbers, section numbers, or document references
        3. Focus on the actual technical content and concepts
        4. If asked about specific services, features, or concepts, provide detailed explanations
        5. Use clear, practical language
        6. If the information is not in the context, say "This information is not available in the provided documents"
        7. Do NOT mention "the document states" or "according to the text" - just provide the answer

        Context:
        {context}

        Question: {question}

        Provide a clear, direct answer without any document references or page numbers:
        """
        
        prompt = PromptTemplate(
            template=prompt_template, 
            input_variables=["context", "question"]
        )
        
        model = get_cached_model(temperature=0.1)  # Lower temperature for more focused answers
        
        _chain_cache[chain_key] = create_stuff_documents_chain(
            llm=model,
            prompt=prompt,
            document_variable_name="context"
        )
        logger.info("Created new conversational chain")
    
    return _chain_cache[chain_key]

def get_response_with_retry(chain, context, question: str, max_retries: int = 3) -> str:
    """
    Execute chain with retry logic for better reliability
    """
    for attempt in range(max_retries):
        try:
            response = chain.invoke({"context": context, "question": question})
            if response and len(response.strip()) > 10:  # Ensure meaningful response
                return response
            else:
                logger.warning(f"Short response on attempt {attempt + 1}: {response}")
        except Exception as e:
            logger.error(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt == max_retries - 1:
                return f"I apologize, but I'm having trouble processing your question right now. Please try rephrasing or try again later. Error: {str(e)}"
    
    return "Unable to generate a response after multiple attempts."

def create_response_cache_key(question: str, context_hash: str) -> str:
    """
    Create a cache key for responses to avoid recomputing similar questions
    """
    combined = f"{question.lower().strip()}_{context_hash}"
    return hashlib.md5(combined.encode()).hexdigest()

def get_context_hash(docs) -> str:
    """
    Create a hash of the document context for caching
    """
    if not docs:
        return ""
    
    context_text = " ".join([doc.page_content if hasattr(doc, 'page_content') else str(doc) for doc in docs])
    return hashlib.md5(context_text.encode()).hexdigest()[:16]