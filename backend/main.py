from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import os
import uuid
import tempfile
import asyncio
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai
from contextlib import asynccontextmanager
import time
import boto3

# --- Logging configuration ---
try:
    from loguru import logger
    # Remove all handlers and add only console handler
    logger.remove()  # Remove default handler
    logger.add(
        lambda msg: print(msg, end=""),
        level="INFO",
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    )
except ImportError:
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

# --- Import project modules ---
from pdf_utils import get_pdf_metadata, get_pdf_text_optimized
from ai_utils import get_text_chunks_optimized
from vector_utils import get_vector_store_optimized, similarity_search_optimized, clear_caches, get_vector_store_info, create_vector_index

# --- Load environment variables and configure API keys ---
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    logger.error("GOOGLE_API_KEY not found in environment variables")
    raise ValueError("GOOGLE_API_KEY is required")
genai.configure(api_key=api_key)

# --- S3 Vectors bucket config ---
S3_VECTOR_BUCKET = os.getenv("S3_VECTOR_BUCKET")
if not S3_VECTOR_BUCKET:
    raise ValueError("S3_VECTOR_BUCKET environment variable is required")

# --- Per-session index naming helper ---
def get_session_index_name(session_id: str) -> str:
    # Each session gets its own S3 Vectors index
    return f"s3vector-index-{session_id}".replace("_", "-")

# --- FastAPI lifespan management (startup/shutdown hooks) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    logger.info("Starting Multi-PDF Chat AI Agent API")
    # Startup: test Google AI connection
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        test_response = model.generate_content("Test connection")
        logger.info("Google AI connection successful")
    except Exception as e:
        logger.error(f"Google AI connection failed: {e}")
    yield
    # Shutdown: clear in-memory caches
    logger.info("Shutting down application")
    clear_caches()

# --- FastAPI app initialization ---
app = FastAPI(
    title="InsightPDF API",
    description="Multi-PDF Chat AI Agent with optimized processing",
    version="2.0.0",
    lifespan=lifespan
)

# --- CORS configuration for frontend integration ---
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# --- Pydantic models for request/response validation ---
from pydantic import BaseModel

class UploadResponse(BaseModel):
    status: str
    files_processed: int
    total_chunks: int
    processing_time: float
    files_info: List[Dict[str, Any]]
    session_id: str

class QuestionRequest(BaseModel):
    question: str
    session_id: str

class QuestionResponse(BaseModel):
    answer: str
    processing_time: float

# --- Health check endpoints ---
@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "message": "Welcome to InsightPDF API - Multi-PDF Chat AI Agent",
        "status": "healthy",
        "version": "2.0.0",
        "endpoints": {
            "upload": "/upload_pdfs",
            "chat": "/ask",
            "health": "/health",
            "info": "/vector_store_info"
        }
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "google_ai": "connected" if api_key else "not configured"
    }

# --- Endpoint: Get vector store info for a session ---
@app.get("/vector_store_info", tags=["Info"])
async def vector_store_info(session_id: str):
    """Get vector store information for a session"""
    try:
        index_name = get_session_index_name(session_id)
        info = get_vector_store_info(index_name, s3_bucket =S3_VECTOR_BUCKET)
        return {"info": info}
    except Exception as e:
        logger.error(f"Error getting vector store info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Helper: Process a single PDF file and extract metadata ---
async def process_pdf_file(file: UploadFile) -> tuple[str, Dict[str, Any]]:
    """Process a single PDF file asynchronously"""
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{file.filename}")
    try:
        # Save file to temp path
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        # Extract PDF metadata
        metadata = get_pdf_metadata(temp_path)
        metadata.update({
            "filename": file.filename,
            "content_type": file.content_type,
            "uploaded_size": len(content)
        })
        logger.info(f"Processed {file.filename}: {metadata['page_count']} pages, {len(content)} bytes")
        return temp_path, metadata
    except Exception as e:
        logger.error(f"Error processing {file.filename}: {e}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=400, detail=f"Error processing {file.filename}: {str(e)}")

# --- Helper: Clean up temporary files after processing ---
async def cleanup_temp_files(temp_paths: List[str]):
    """Clean up temporary files"""
    for path in temp_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
                # Remove temp directory if empty
                temp_dir = os.path.dirname(path)
                if os.path.exists(temp_dir) and not os.listdir(temp_dir):
                    os.rmdir(temp_dir)
        except Exception as e:
            logger.error(f"Error cleaning up {path}: {e}")

# --- Endpoint: Upload and process multiple PDF files ---
@app.post("/upload_pdfs", response_model=UploadResponse, tags=["PDF Processing"])
async def upload_pdfs(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
):
    """
    Upload and process multiple PDF files with optimized processing.
    """
    start_time = time.time()
    session_id = str(uuid.uuid4())
    logger.info(f"OPTIMIZED: Starting upload with {len(files)} files for session {session_id}")
    
    # Validate files
    for file in files:
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail=f"Only PDF files are allowed. Got: {file.filename}")
        if file.size and file.size > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File {file.filename} is too large (max 50MB)")
    
    temp_paths = []
    files_info = []
    
    try:
        # Process all files concurrently
        tasks = [process_pdf_file(file) for file in files]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for i, result in enumerate(results):
            if isinstance(result, tuple):
                temp_path, metadata = result
                temp_paths.append(temp_path)
                files_info.append(metadata)
            else:
                logger.error(f"Failed to process file {files[i].filename}: {result}")
                raise HTTPException(status_code=400, detail=f"Failed to process {files[i].filename}")
        
        logger.info("Extracting text from PDFs...")
        raw_text = await get_pdf_text_optimized(temp_paths)
        
        if not raw_text or len(raw_text.strip()) < 100:
            raise HTTPException(status_code=400, detail="No meaningful text found in the uploaded PDFs")
        
        logger.info("Creating text chunks...")
        text_chunks = get_text_chunks_optimized(raw_text)
        
        if not text_chunks:
            raise HTTPException(status_code=400, detail="Failed to create text chunks from PDFs")
        
        # ✅ OPTIMIZED: Create vector store with better error handling
        index_name = get_session_index_name(session_id)
        
        logger.info(f"Creating S3 Vectors index: {index_name}")
        create_vector_index(index_name, s3_bucket=S3_VECTOR_BUCKET, index_dim=768)
        
        logger.info(f"Uploading {len(text_chunks)} chunks to S3 Vectors...")
        get_vector_store_optimized(text_chunks, index_name, s3_bucket=S3_VECTOR_BUCKET)
        
        processing_time = time.time() - start_time
        
        # Store upload info
        global upload_info
        upload_info = {
            "files_count": len(files_info),
            "chunks_count": len(text_chunks),
            "upload_time": time.time(),
            "processing_time": processing_time,
            "files_info": files_info
        }
        
        background_tasks.add_task(cleanup_temp_files, temp_paths)
        
        logger.info(f"OPTIMIZED: Upload completed in {processing_time:.2f}s")
        
        return UploadResponse(
            status="success",
            files_processed=len(files_info),
            total_chunks=len(text_chunks),
            processing_time=processing_time,
            files_info=files_info,
            session_id=session_id
        )
        
    except HTTPException:
        await cleanup_temp_files(temp_paths)
        raise
    except Exception as e:
        await cleanup_temp_files(temp_paths)
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload processing failed: {str(e)}")

# --- Endpoint: Ask a question about the uploaded PDFs ---
@app.post("/ask", response_model=QuestionResponse, tags=["Chat"])
async def ask_question(request: QuestionRequest):
    """
    Ask a question about the uploaded PDFs with optimized search.
    """
    start_time = time.time()
    
    if not request.question or not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    session_id = request.session_id
    logger.info(f"OPTIMIZED: Processing question for session {session_id}")
    logger.info(f"Question: {request.question[:100]}...")
    
    try:
        index_name = get_session_index_name(session_id)
        response_text = similarity_search_optimized(
            request.question, 
            index_name, 
            s3_bucket=S3_VECTOR_BUCKET
        )
        
        processing_time = time.time() - start_time
        logger.info(f"🎉 OPTIMIZED: Question answered in {processing_time:.2f}s")
        
        return QuestionResponse(
            answer=response_text,
            processing_time=processing_time
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Question processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Question processing failed: {str(e)}")


# --- Endpoint: Clear all caches (admin) ---
@app.delete("/clear_cache", tags=["Admin"])
async def clear_all_cache():
    """Clear all caches - Admin endpoint"""
    try:
        clear_caches()
        global upload_info
        upload_info.clear()
        logger.info("All caches cleared")
        return {"status": "success", "message": "All caches cleared"}
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Run the FastAPI app with Uvicorn (for local development) ---
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting InsightPDF API server...")
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )