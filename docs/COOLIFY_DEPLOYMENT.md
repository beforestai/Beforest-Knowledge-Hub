# Coolify Deployment Guide

This repository contains a Next.js frontend and a FastAPI backend for Beforest KMS. In Coolify, deploy them as separate services that share PostgreSQL, Redis, and a persistent upload volume.

## Services

Create these resources in one Coolify project:

1. PostgreSQL database
2. Redis database
3. FastAPI backend service
4. Next.js frontend service
5. Ingestion worker service

Recommended public routes:

- Frontend: `https://kms.example.com`
- Backend: `https://kms-api.example.com`

The backend can also stay private if the Next.js service can reach it through Coolify's internal network.

## Required Environment Variables

### Frontend

Set these on the Next.js service:

```env
KMS_API_BASE_URL=https://kms-api.example.com
```

If the backend is private inside Coolify, use its internal service URL instead.

### Backend

Set these on the FastAPI backend and ingestion worker services:

```env
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
API_CORS_ORIGINS=https://kms.example.com
UPLOAD_DIR=/app/uploads
REDIS_URL=redis://HOST:6379/0
INGESTION_QUEUE_NAME=kms-document-ingestion
EMBEDDING_MODEL_NAME=BAAI/bge-base-en-v1.5
EMBEDDING_DIMENSIONS=768
CHUNK_TARGET_CHARS=1200
CHUNK_OVERLAP_CHARS=180
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=your-production-key
LLM_MODEL=gpt-4o-mini
```

Do not put `LLM_API_KEY` in the frontend service.

## PostgreSQL Requirements

The backend uses PostgreSQL with the `pgvector` extension.

Before running migrations, make sure the database supports:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

If Coolify's default PostgreSQL image does not include pgvector, use a PostgreSQL image that includes it, or install/enable pgvector in the database container before running the app migrations.

## Persistent Upload Volume

Uploaded files are stored at:

```txt
/app/uploads
```

Mount a persistent volume to `/app/uploads` on the FastAPI backend service.

If the ingestion worker runs as a separate service, it must read the same uploaded files. Mount the same persistent volume to `/app/uploads` on the worker service too.

## Backend Service

Use a Python build/runtime.

Install command:

```bash
pip install -r backend/requirements.txt
```

Start command:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

Exposed port:

```txt
8000
```

Health check:

```txt
/health
```

## Database Migrations

Run these once after the backend can connect to PostgreSQL:

```bash
python backend/scripts/init_db.py
python backend/scripts/upgrade_team_ownership.py
python backend/scripts/upgrade_file_metadata.py
python backend/scripts/upgrade_ingestion_queue.py
python backend/scripts/upgrade_pgvector_chunks.py
python backend/scripts/seed_documents.py
```

In Coolify, run them from the backend service terminal or as a one-off command/job.

Do not run `seed_documents.py` repeatedly if you do not want demo seed pages in production. It is safe against duplicate slugs, but production teams may prefer a clean database.

## Ingestion Worker Service

Create a separate worker service from the same repository.

Install command:

```bash
pip install -r backend/requirements.txt
```

Start command:

```bash
python backend/scripts/run_ingestion_worker.py
```

Required access:

- Same `DATABASE_URL`
- Same `REDIS_URL`
- Same `UPLOAD_DIR`
- Same mounted `/app/uploads` volume

The worker extracts uploaded document text, chunks it, generates embeddings, and writes pgvector rows to PostgreSQL.

## Frontend Service

Use the repository root as the app directory.

Install command:

```bash
npm ci
```

Build command:

```bash
npm run build
```

Start command:

```bash
npm run start
```

Exposed port:

```txt
3000
```

Make sure `KMS_API_BASE_URL` points to the deployed backend URL.

## Deployment Order

1. Create PostgreSQL.
2. Create Redis.
3. Deploy backend service.
4. Run database migrations.
5. Deploy ingestion worker service.
6. Deploy frontend service.
7. Open the frontend and verify pages load from the backend.

## Smoke Tests

After deployment:

1. Open backend health:

   ```txt
   https://kms-api.example.com/health
   ```

   Expected:

   ```json
   {"status":"ok"}
   ```

2. Check teams:

   ```txt
   https://kms-api.example.com/api/v1/teams
   ```

3. Check current user:

   ```txt
   https://kms-api.example.com/api/v1/users/me
   ```

4. Open frontend and confirm:

   - All Pages loads
   - Team Spaces loads
   - Create Page shows the current user's team as read-only
   - Ask KMS returns a backend response when documents are ingested

## Common Issues

### Frontend Shows Backend Unavailable

Check:

- `KMS_API_BASE_URL` on the frontend service
- backend public URL or internal Coolify URL
- backend CORS setting `API_CORS_ORIGINS`

### Upload Works But Ingestion Does Not

Check:

- Redis is running
- worker service is running
- backend and worker use the same `INGESTION_QUEUE_NAME`
- backend and worker share the same `/app/uploads` volume

### pgvector Migration Fails

The PostgreSQL image may not include pgvector. Use a pgvector-enabled image or enable the extension before running:

```bash
python backend/scripts/upgrade_pgvector_chunks.py
```

### LLM Features Fail

Check:

- `LLM_API_KEY` is set on the backend
- `LLM_API_URL` is reachable from the backend container
- `LLM_MODEL` is supported by the configured provider

## Production Notes

- Replace the seeded Demo User with real authentication before production rollout.
- Keep `LLM_API_KEY` backend-only.
- Use strong database and Redis credentials.
- Set upload volume backups if uploaded documents are important.
- Consider moving migrations to a formal migration tool such as Alembic before multiple environments are active.
