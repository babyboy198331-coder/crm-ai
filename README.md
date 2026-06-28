# CRM AI

AI-powered CRM with customer/contact management, file uploads, role-based permissions, and AI features (meeting summaries, follow-up email drafts, customer Q&A chatbot).

## Stack

- **backend/** — Node.js, Express, Prisma, PostgreSQL, JWT auth, OpenAI API
- **frontend/** — Next.js (App Router), Tailwind CSS, Recharts

## Local development

### 1. Start Postgres

```bash
docker compose up postgres -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in JWT_SECRET and OPENAI_API_KEY (or Groq, see below)
npm install
npm run prisma:migrate
npm run prisma:seed     # creates admin@example.com / password123
npm run dev              # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev               # http://localhost:3000
```

Log in with `admin@example.com` / `password123` (from the seed script), or sign up a new account.

### Or run everything with Docker Compose

```bash
cp backend/.env.example backend/.env   # for reference; compose sets DB/JWT vars itself
export OPENAI_API_KEY=sk-...
docker compose up --build
```

Frontend: http://localhost:3000, backend: http://localhost:4000.

## Using Groq instead of OpenAI

The AI features call any OpenAI-compatible API, so Groq works as a drop-in replacement (and is free/fast for testing):

1. Get a key at https://console.groq.com
2. In `backend/.env` (or as env vars for Docker Compose), set:
   ```
   OPENAI_API_KEY=gsk_your_groq_key
   OPENAI_BASE_URL=https://api.groq.com/openai/v1
   OPENAI_MODEL=openai/gpt-oss-120b
   ```
3. Restart the backend. No code changes needed.

Note: Groq deprecates and swaps out models fairly often. As of mid-2026, `llama-3.3-70b-versatile` and `llama-3.1-8b-instant` were retired in favor of `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, and `qwen/qwen3.6-27b`. Check https://console.groq.com/docs/models for the current list before picking a model.

## Roles

- `ADMIN` / `MANAGER` — can delete customers, full access
- `REP` — default role, can manage their own customers

## Deploying to Railway

Deploy as three separate Railway services from this repo:

1. **Postgres** — add the Railway Postgres plugin; copy its `DATABASE_URL`.
2. **backend** — new service, root directory `backend`, Dockerfile build (railway.json included). Set env vars: `DATABASE_URL` (from step 1), `JWT_SECRET`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `CORS_ORIGIN` (your frontend's Railway URL).
3. **frontend** — new service, root directory `frontend`, Dockerfile build. Set build arg / env var `NEXT_PUBLIC_API_URL` to your backend's Railway URL.

Railway runs `prisma migrate deploy` automatically on backend start (see `backend/Dockerfile` CMD).

## Project structure

```
backend/
  src/
    routes/        auth, customers, files, ai, analytics
    middleware/     JWT auth + role checks
    services/       OpenAI client
  prisma/           schema + seed
frontend/
  app/              login, dashboard, customers list/detail
  lib/              API client, auth hook
  components/       NavBar
```
