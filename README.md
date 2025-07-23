# InsightPDF: Multi-PDF Chat AI Agent

InsightPDF is a full-stack application that lets you upload multiple PDF documents and chat with them using advanced AI. It leverages Google Gemini for embeddings, FAISS for vector search, and S3 for scalable, serverless storage.

---

## Features
- **Upload Multiple PDFs:** Drag and drop or select multiple PDF files for analysis.
- **AI-Powered Chat:** Ask questions about your uploaded documents and get intelligent, context-aware answers.
- **Per-Session Isolation:** Each upload session is isolated with a unique session ID.
- **Cloud-Native Storage:** All vector indexes are stored and loaded directly from S3 (no local storage required).
- **Amazon S3 Vectors Storage:** Utilizes Amazon S3 Vectors for scalable, serverless vector storage and high-performance similarity search.

---

## Requirements

- Python 3.11 or higher
- Node.js 20+ and npm

---

## Project Structure

```
my-project/
├── backend/
│   ├── main.py
│   └── ai_utils.py
│   └── config.py
│   └── pdf_utils.py
│   └── vector_utils.py
│   └── requiresments.txt
│   └── .env.example
├── frontend/
│   ├── public/
|   |   ├── favicon.co
|   |   ├── logo.png
│   ├── src/
|   |   ├── components/
|   |   |   ├── ChatBot.tsx
|   |   |   ├── ChatInput.tsx
|   |   |   ├── GradientBG.tsx
|   |   |   ├── MessageBubble.tsx
|   |   |   ├── PdfUploader.tsx
|   |   ├── App.tsx
|   |   ├── main.tsx
|   |   ├── theme.tsx
│   ├── .env.example
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── vite-env.d.ts
│   ├── vite.config.js
└── .gitignore
└── README.md
```
---

## How It Works

1. **Upload PDFs:**
   - User uploads one or more PDF files via the frontend.
   - Backend extracts text, chunks it, creates a FAISS vector index, and uploads it to S3.
   - Backend returns a `session_id` to the frontend.

2. **Chat with Documents:**
   - User asks questions in the chat UI.
   - Frontend sends the question and `session_id` to the backend.
   - Backend loads the FAISS index from S3, performs a similarity search, and uses Google Gemini to generate an answer.
   - Answer is returned and displayed in the chat.

---

## Environment Variables

### Backend (`backend/.env`)

  - GOOGLE_API_KEY=your-google-api-key <br>
   Get your Google API key from: https://aistudio.google.com/app/apikey
  - S3_BUCKET=your-s3-bucket-name
  - CORS_ORIGINS=your-frontend-domain


### Frontend (`frontend/.env`)

  - VITE_API_URL=http://localhost:8000

---

## Quick Start (Development)

### Backend
1. `cd backend`
2. Create and activate a Python virtual environment.
3. Install dependencies: `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and fill in your values.
5. Run the server: `uvicorn main:app --reload`

### Frontend
1. `cd frontend`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and set `VITE_API_URL` if needed.
4. Run the dev server: `npm run dev`

---

## Tech Stack
- **Backend:** FastAPI, FAISS, Google Gemini, S3 Vectors, PyMuPDF, PyPDF2
- **Frontend:** React, Vite, Material UI
- **Cloud:** S3 Vectors for vector index storage

---

## Credits
Created by Harsh Negi