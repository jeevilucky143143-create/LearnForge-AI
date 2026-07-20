# PDF2Course

PDF2Course is an AI-powered e-learning platform that transforms raw educational PDF documents (textbooks, lecture notes, papers) into structured, interactive study courses. The app parses documents, structures them into chapters and lessons, and generates practice quizzes and interactive analytics dashboards.

---

## 🚀 Key Features

1. **Secure Authentication & Management**: Fully integrated with **Supabase Auth** for secure user login, registration, and data scoping.
2. **Interactive Course Syllabus**: Generates chapter timelines and dynamic learning modules from any PDF.
3. **AI Quiz Assessment Engine**: Creates and grades course-specific multiple-choice assessments with corrective explanations.
4. **Vector-Based Semantic Search**: Search topics across your syllabus using Latent Semantic Analysis (LSA) dense embedding representations.
5. **Study Bookmarks & Notes**: Pin topics for later review and maintain markdown notes in a split preview workspace.
6. **Learning Analytics**: Visualizes study duration, course completion rates, streaks, and quiz performance metrics.

---

## 🛠️ Architecture & Tech Stack

```
                     ┌──────────────────┐
                     │    Next.js UI    │
                     └──────────────────┘
                              │ (FastAPI REST calls)
                              ▼
                     ┌──────────────────┐
                     │   FastAPI App    │
                     └──────────────────┘
                      /        |       \
                     /         |        \
  ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
  │ Supabase Auth/S3 │ │ PostgreSQL   │ │ Groq Llama 3.3   │
  └──────────────────┘ └──────────────┘ └──────────────────┘
```

* **Frontend**: Next.js (React), Tailwind CSS, Lucide icons, Axios.
* **Backend**: FastAPI (Python), SQLAlchemy 2.x, Alembic migrations.
* **Database & Auth**: PostgreSQL (Supabase), Supabase Auth.
* **AI Pipelines**: Groq (Llama-3.3-70b-versatile) for course generation and quiz grading.

---

## 💻 Local Quickstart

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL instance running locally or on Supabase.

### 1. Backend Setup
1. Navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Configure environment variables in `app/core/config.py` or export them in your terminal:
   ```bash
   export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pdf2course"
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-role-key"
   export SUPABASE_JWT_SECRET="your-jwt-secret"
   export GROQ_API_KEY="your-groq-key"
   ```
3. Run migrations and start uvicorn server:
   ```bash
   python3 -m alembic upgrade head
   python3 -m uvicorn app.main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Navigate to `/frontend`:
   ```bash
   cd ../frontend
   ```
2. Install dependencies and start development server:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser.

---

## 🧪 Running Unit Tests
To run the full backend testing suite:
```bash
cd backend
python3 tests/run_tests.py
```

---

## 📦 Deployment Guide

### Database & Storage (Supabase)
1. Set up a PostgreSQL database and create a private bucket named `pdfs` under storage settings.
2. Enable RLS on the bucket with policy allowing access to authenticated owners.

### Backend (Render / Heroku)
1. Add a new Web Service pointing to `backend/`.
2. Select Docker as the environment runtime.
3. Configure environment variables in settings.

### Frontend (Vercel)
1. Import the repository and select `frontend` directory.
2. Configure `NEXT_PUBLIC_API_URL` pointing to the deployed backend url.
