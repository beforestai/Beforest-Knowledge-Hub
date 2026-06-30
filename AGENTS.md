# AGENTS.md

## Project Overview

Beforest Knowledge Hub (KMS) is a centralized knowledge management system for teams. It supports knowledge pages, file uploads, team-based ownership, semantic search, and AI-powered chat responses with citations.

## Repository Structure

- `/app`: Next.js App Router frontend pages and API proxy routes.
- `/components`: Reusable React UI components for the KMS shell, views, dialogs, cards, chat, and icons.
- `/lib`: Frontend API clients and proxy helpers.
- `/data`: Local prototype seed data and fallback values.
- `/backend/app/api`: FastAPI route handlers for documents, pages, teams, users, chunks, chat, and collective overview.
- `/backend/app/models`: SQLAlchemy ORM models for database tables.
- `/backend/app/services`: Backend business logic for documents, teams, users, uploads, search, embeddings, ingestion, and LLM calls.
- `/backend/app/workers`: Background worker logic for document ingestion.
- `/backend/scripts`: Database initialization, migrations, seeding, and worker startup scripts.

## Core Database Tables

- `teams`: Stores stable team records.
- `users`: Stores users and their assigned team.
- `documents`: Stores knowledge pages, ownership metadata, file metadata, and ingestion status.
- `document_chunks`: Stores extracted document chunks and vector embeddings for semantic search.

Relationships:

- `users.team_id -> teams.id`
- `documents.team_id -> teams.id`
- `document_chunks.document_id -> documents.id`

## Team Ownership Rules

- Users can view documents from all teams.
- Users can create documents only for their own team.
- Users can edit, delete, and upload files only for documents belonging to their own team.
- Backend permission checks are the source of truth.
- Frontend hiding of edit, save, and upload controls is only a UX layer.

## AI Search and Chat Architecture

Documents are stored in `documents`. Uploaded files and page content are split into `document_chunks`, embeddings are generated from those chunks, and PostgreSQL with pgvector is used for semantic search. Chat retrieves relevant chunks and returns answers with citations back to the source documents.

## Infrastructure

The application uses:

- Next.js frontend
- FastAPI backend
- PostgreSQL
- pgvector
- Redis
- RQ worker
- Upload storage volume
- OpenAI-compatible LLM provider

## Deployment Architecture

Deployment is planned through Coolify with:

- Frontend service
- Backend service
- PostgreSQL resource
- Redis resource
- Worker service
- Persistent uploads volume

## Development Guidelines

- Never hardcode secrets.
- Use environment variables for configuration.
- Keep permission checks in the backend.
- Do not remove team ownership enforcement.
- Maintain backward compatibility where possible.
- Prefer reusable services over duplicate logic.

## Important Notes

- Current users and teams are database-backed.
- Authentication is not fully implemented yet.
- Document versioning is planned for a future phase.
- Audit logging is planned for a future phase.
