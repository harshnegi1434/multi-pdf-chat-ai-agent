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
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── Dockerfile.local
│   ├── main.py
│   └── ai_utils.py
│   └── config.py
│   └── pdf_utils.py
│   └── vector_utils.py
│   └── requirements.txt
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


## Deployment

### Backend (AWS Lambda + API Gateway)
1. Build the Docker image using the provided Lambda Dockerfile (`backend/Dockerfile`).
2. Push the image to AWS ECR (Elastic Container Registry).
3. Create or update an AWS Lambda function using the ECR image.
4. Set environment variables in Lambda as needed.
5. Create an API Gateway and connect it to your Lambda function.
6. Configure CORS and endpoint security as required.

### Frontend (AWS S3 + CloudFront)
1. Build the frontend with `npm run build`. Configure the VITE_API_URL before building.
2. Upload the contents of the `dist` folder to your S3 bucket.
3. Set the S3 bucket for static website hosting (block public access, use OAC if needed).
4. Create a CloudFront distribution pointing to the S3 bucket.
5. (Optional) Set up a custom domain and SSL certificate using AWS ACM.
6. Update DNS records to point your domain to the CloudFront distribution.

## Tech Stack
+**Backend:**
  - FastAPI (API framework)
  - FAISS (vector search)
  - Google Gemini (AI embeddings & chat)
  - PyMuPDF, PyPDF2 (PDF parsing)
  - Boto3 (AWS SDK for S3)

**Frontend:**
  - React (UI library)
  - Vite (build tool)
  - Material UI (component library)

**Cloud & DevOps:**
  - AWS Lambda (serverless backend)
  - AWS API Gateway (API endpoint)
  - AWS S3 (static hosting & vector storage)
  - AWS CloudFront (CDN & SSL)
  - AWS ECR (container registry)
  - Docker (containerization)

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Credits
Created by Harsh Negi
 
---

## Future Updates

- **CI/CD Pipelines:** Automate build, test, and deployment using GitHub Actions or AWS CodePipeline.
- **Session Management & User Authentication:** Add user accounts, persistent sessions, and secure authentication (OAuth, JWT, etc.).

Suggestions and contributions are welcome!