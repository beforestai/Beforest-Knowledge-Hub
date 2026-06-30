# KMS Backend API

FastAPI service for Beforest KMS documents/pages backed by PostgreSQL.

## Setup

1. Create a PostgreSQL database.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Install dependencies:

```powershell
npm.cmd run backend:install
```

4. Create tables:

```powershell
npm.cmd run db:init
npm.cmd run db:upgrade:team-ownership
npm.cmd run db:upgrade:file-metadata
npm.cmd run db:upgrade:ingestion-queue
npm.cmd run db:upgrade:pgvector-chunks
```

5. Run the API:

```powershell
npm.cmd run dev:backend
```

6. Confirm the API is listening:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/health -UseBasicParsing
```

Optional seed:

```powershell
npm.cmd run db:seed
```

## Ingestion Worker

Uploaded files are stored in `UPLOAD_DIR` and queued for ingestion through Redis/RQ.

```powershell
npm.cmd run worker:ingestion
```

Required environment:

```env
REDIS_URL=redis://127.0.0.1:6379/0
UPLOAD_DIR=backend/uploads
INGESTION_QUEUE_NAME=kms-document-ingestion
EMBEDDING_MODEL_NAME=BAAI/bge-base-en-v1.5
EMBEDDING_DIMENSIONS=768
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=your-api-key
LLM_MODEL=gpt-4o-mini
```

The worker extracts text, chunks it, generates embeddings with `BAAI/bge-base-en-v1.5`, and stores them in `document_chunks.embedding` as `vector(768)`.

## Endpoints

- `GET /health`
- `GET /api/v1/documents`
- `POST /api/v1/documents`
- `GET /api/v1/documents/{id}`
- `PATCH /api/v1/documents/{id}`
- `DELETE /api/v1/documents/{id}`
- `GET /api/v1/pages`
- `POST /api/v1/pages`
- `GET /api/v1/pages/{id}`
- `PATCH /api/v1/pages/{id}`
- `DELETE /api/v1/pages/{id}`
- `GET /api/v1/chunks/documents/{document_id}`
- `POST /api/v1/chunks/search`
- `POST /api/v1/chat/ask`
- `POST /api/v1/collective/overview`
- `GET /api/v1/teams`
- `GET /api/v1/users/me`

`pages` is currently an alias of `documents` because the KMS prototype treats every knowledge item as a page/document record.

`chat/ask` retrieves embedded document chunks from pgvector, calls the configured OpenAI-compatible LLM API, and returns a cited answer plus KMS citation links. `collective/overview` fetches approved Beforest source pages server-side and summarizes them through the configured LLM API key.
