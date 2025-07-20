from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os
from dotenv import load_dotenv
import google.generativeai as genai


from pdf_utils import get_pdf_text
from ai_utils import get_text_chunks
from vector_utils import get_vector_store, similarity_search_docs

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

app = FastAPI()

# Allow frontend to connect (adjust origins for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.post("/upload_pdfs")
async def upload_pdfs(files: List[UploadFile] = File(...)):
    # Save files temporarily and process
    temp_paths = []
    for file in files:
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(await file.read())
        temp_paths.append(temp_path)

    try:
        raw_text = get_pdf_text(temp_paths)
        text_chunks = get_text_chunks(raw_text)
        get_vector_store(text_chunks)
    finally:
        # Clean up temp files
        for path in temp_paths:
            if os.path.exists(path):
                os.remove(path)
    return {"status": "success", "text_chunks": len(text_chunks)}

@app.post("/ask")
async def ask_question(question: str = Form(...)):
    response_text = similarity_search_docs(question)
    return {"answer": response_text}

@app.get("/")
async def root():
    return {"message": "Welcome to the Multi-PDF Chat AI Agent API."}