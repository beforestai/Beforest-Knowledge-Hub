# Beforest KMS

Next.js frontend with a FastAPI/PostgreSQL backend API.

## Frontend

```powershell
npm.cmd install
npm.cmd run dev
```

The Next.js app runs at `http://127.0.0.1:3000`.

## Backend API

```powershell
Copy-Item backend/.env.example backend/.env
npm.cmd run backend:install
npm.cmd run db:init
npm.cmd run db:upgrade:team-ownership
npm.cmd run db:upgrade:file-metadata
npm.cmd run db:upgrade:ingestion-queue
npm.cmd run db:upgrade:pgvector-chunks
npm.cmd run db:seed
npm.cmd run dev:backend
```

The backend runs at `http://127.0.0.1:8000`. Confirm it is up before testing uploads:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/health -UseBasicParsing
```

Set `backend/.env` with the PostgreSQL connection:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5432/beforest_kms
API_CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
UPLOAD_DIR=backend/uploads
REDIS_URL=redis://127.0.0.1:6379/0
INGESTION_QUEUE_NAME=kms-document-ingestion
EMBEDDING_MODEL_NAME=BAAI/bge-base-en-v1.5
EMBEDDING_DIMENSIONS=768
CHUNK_TARGET_CHARS=1200
CHUNK_OVERLAP_CHARS=180
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_API_KEY=your-api-key
LLM_MODEL=gpt-4o-mini
```

## API Routes

FastAPI:

- `GET /health`
- `GET /api/v1/documents?search=&team=&category=&limit=&offset=`
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

Next.js proxies:

- `/api/documents`
- `/api/documents/{id}`
- `/api/pages`
- `/api/pages/{id}`
- `/api/chunks/documents/{id}`
- `/api/chunks/search`
- `/api/chat/ask`
- `/api/collective/overview`
- `/api/teams`
- `/api/users/me`

The frontend now uses the backend API for document/page reads and creates. `All Pages`, `Team Spaces`, `Recently Updated`, and `Create Page` are derived from `GET /api/documents` and `POST /api/documents`. `Ask KMS` calls the backend RAG endpoint through `POST /api/chat/ask`, which retrieves pgvector chunks, calls the configured API-based LLM, and returns answers with citation links. Collective overview generation also runs through the backend via `POST /api/collective/overview`; browser code never reads or stores the LLM API key.

## Team Ownership

The prototype current user is stored in PostgreSQL as `Demo User` in the `Marketing` team. Initial teams are seeded into the `teams` table, the default user is seeded into `users`, and `documents.team_id` stores stable ownership while `documents.team` remains for backward-compatible display.

New pages are automatically owned by the current user's database team; the create form shows Team Owner as read-only and does not submit a selectable owner. Users can view, search, and download pages across all teams, but edit, delete, and existing-page file upload requests are allowed only when `documents.team_id` matches the current user's `users.team_id`. The backend validates this rule before protected writes and rejects cross-team changes.

Final ownership schema:

```sql
teams (
  id VARCHAR(120) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

users (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  team_id VARCHAR(120) NOT NULL REFERENCES teams(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

documents (
  id UUID PRIMARY KEY,
  team VARCHAR(120) NOT NULL,
  team_id VARCHAR(120) NOT NULL REFERENCES teams(id),
  ...
);
```

File uploads from Create Page are sent to FastAPI as multipart form data. The backend writes uploaded files to `UPLOAD_DIR` (default `backend/uploads` for local development) and stores `fileStoragePath`, `fileSizeBytes`, and `fileContentType` in PostgreSQL.

When a file is uploaded, FastAPI creates a Redis/RQ ingestion job. Start Redis first, then run:

```powershell
npm.cmd run worker:ingestion
```

The worker updates `ingestionStatus`, `ingestionJobId`, `ingestionError`, and `ingestedAt` on the document row.

The ingestion worker extracts text, splits it into overlapping chunks, embeds each chunk with `BAAI/bge-base-en-v1.5`, and stores vectors in PostgreSQL using pgvector. The default embedding dimension is `768`.
