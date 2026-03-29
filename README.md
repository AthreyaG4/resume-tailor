# Resume Tailor

A web app that transforms a user’s master resume into a tailored resume for a specific job posting. Upload your base resume once, then provide a job description or LinkedIn job ID and this service adjusts your profile content to match the role using automated parsing, text extraction, and resume generation.

## What it does

- Accepts user resume input and saves it as a *master resume*.
- Parses and stores resume data in structured form.
- Accepts a job description text or LinkedIn job ID.
- Builds a job-targeted prompt to generate a tailored resume that matches core skills, experience and job keywords.
- Maintains application history so users can track tailored versions and sent applications.

## Features

- User authentication and session handling.
- Master resume upload from PDF / text.
- Job description input + LinkedIn job ID workflow.
- OpenAI / LLM-driven tailoring engine.
- Resume generation in `.tex` and PDF rendering pipeline.
- History and application tracking with DB models.
- API routes for current resume, tailored resume, applications and auth.

## Tech stack

- Backend: Python, FastAPI, Pydantic, PostgreSQL (or SQLite for local/dev), JWT, password hashing, async routes.
- Frontend: React, Vite, hooks/context, practical form components and API clients.
- AI layer: OpenAI/LLM prompt orchestration in `backend/agent` and resume parsing in `backend/utils`.
- Deployment: Docker Compose, backend service container, frontend service container, and optional Vercel for static frontend hosting.

## Local setup

1. Clone repository:

   ```bash
   git clone <repo-url>
   cd resume-tailor
   ```

2. Copy example env file and configure:

   ```bash
   cp .env.example .env
   # edit .env with database (PostgreSQL/SQLite), JWT, AWS credentials, LLamaParse Credentials and OpenAI key
   ```

3. Start services using Docker Compose:

   ```bash
   docker compose up --build
   ```

4. (Optional) If you need to override local env vars:

   ```bash
   export DATABASE_URL="sqlite:///app.db"  # or your DB
   export JWT_SECRET_KEY=your-secret
   export OPENAI_API_KEY=your-openai-key
   ```

5. Open browser at `http://localhost:5173`. Backend default is `http://localhost:5000`.

## API overview

- `POST /auth/signup` - register user
- `POST /auth/login` - login and obtain token
- `GET /resume` - fetch current master resume
- `POST /resume` - save/update master resume
- `POST /resume/tailor` - send job description/LinkedIn ID and get tailored resume
- `GET /applications` - list saved applications
- `POST /applications` - save job + tailored resume snapshot

## Project structure

- `backend/`: server logic, API, models, helpers
- `frontend/`: React UI and client API hooks
- `compose.yml`: local service definitions
- `README.md`: the file you’re reading

---

Built with ❤️ for automated resume tailoring and smart job matching.
