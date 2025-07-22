import fitz  # PyMuPDF - much faster than PyPDF2
from PyPDF2 import PdfReader
import asyncio
import aiofiles
from typing import List
from loguru import logger
import os

async def get_pdf_text_optimized(pdf_paths: List[str]) -> str:
    """
    Optimized PDF text extraction using PyMuPDF (faster than PyPDF2)
    with async processing for better performance
    """
    texts = []
    
    async def extract_single_pdf(pdf_path: str) -> str:
        try:
            # Use PyMuPDF for faster text extraction
            doc = fitz.open(pdf_path)
            text = ""
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text()
                if page_text.strip():  # Only add non-empty text
                    text += page_text + "\n"
            
            doc.close()
            logger.info(f"Successfully extracted text from {pdf_path}: {len(text)} characters")
            return text
            
        except Exception as e:
            logger.error(f"Error extracting text from {pdf_path}: {str(e)}")
            # Fallback to PyPDF2 if PyMuPDF fails
            try:
                return get_pdf_text_fallback([pdf_path])
            except:
                return ""
    
    # Process PDFs concurrently for better speed
    tasks = [extract_single_pdf(pdf_path) for pdf_path in pdf_paths]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Combine all text results
    combined_text = ""
    for i, result in enumerate(results):
        if isinstance(result, str):
            combined_text += result
        else:
            logger.error(f"Failed to process {pdf_paths[i]}: {result}")
    
    logger.info(f"Total extracted text length: {len(combined_text)} characters")
    return combined_text

def get_pdf_text_fallback(pdf_paths: List[str]) -> str:
    """
    Fallback method using PyPDF2 (original implementation)
    """
    text = ""
    for pdf in pdf_paths:
        try:
            pdf_reader = PdfReader(pdf)
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:  # Sometimes extract_text() can return None
                    text += page_text + "\n"
        except Exception as e:
            logger.error(f"Error reading PDF {pdf} with PyPDF2: {str(e)}")
    return text

def get_pdf_text(pdf_paths: List[str]) -> str:
    """
    Synchronous PDF text extraction using PyMuPDF
    """
    combined_text = ""
    
    for pdf_path in pdf_paths:
        try:
            # Use PyMuPDF for faster text extraction
            doc = fitz.open(pdf_path)
            text = ""
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                page_text = page.get_text()
                if page_text.strip():  # Only add non-empty text
                    text += page_text + "\n"
            
            doc.close()
            combined_text += text
            logger.info(f"Successfully extracted text from {pdf_path}: {len(text)} characters")
            
        except Exception as e:
            logger.error(f"Error extracting text from {pdf_path}: {str(e)}")
            # Fallback to PyPDF2 if PyMuPDF fails
            try:
                fallback_text = get_pdf_text_fallback([pdf_path])
                combined_text += fallback_text
            except Exception as e2:
                logger.error(f"Fallback also failed for {pdf_path}: {str(e2)}")
    
    logger.info(f"Total extracted text length: {len(combined_text)} characters")
    return combined_text

def get_pdf_metadata(pdf_path: str) -> dict:
    """
    Extract PDF metadata for better document tracking
    """
    try:
        doc = fitz.open(pdf_path)
        metadata = doc.metadata
        page_count = len(doc)
        doc.close()
        
        return {
            "title": metadata.get("title", ""),
            "author": metadata.get("author", ""),
            "subject": metadata.get("subject", ""),
            "creator": metadata.get("creator", ""),
            "producer": metadata.get("producer", ""),
            "creation_date": metadata.get("creationDate", ""),
            "modification_date": metadata.get("modDate", ""),
            "page_count": page_count,
            "file_size": os.path.getsize(pdf_path)
        }
    except Exception as e:
        logger.error(f"Error extracting metadata from {pdf_path}: {str(e)}")
        return {"page_count": 0, "file_size": 0}