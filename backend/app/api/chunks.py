from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.schemas.document_chunk import ChunkSearchRequest, ChunkSearchResult, DocumentChunkRead
from backend.app.services.document_chunks import list_document_chunks, search_document_chunks

router = APIRouter(prefix="/chunks", tags=["chunks"])


@router.get("/documents/{document_id}", response_model=list[DocumentChunkRead])
def list_document_chunks_endpoint(document_id: UUID, db: Session = Depends(get_db)) -> list[DocumentChunkRead]:
    return list_document_chunks(db, document_id)


@router.post("/search", response_model=list[ChunkSearchResult])
def search_chunks_endpoint(payload: ChunkSearchRequest, db: Session = Depends(get_db)) -> list[ChunkSearchResult]:
    limit = max(1, min(payload.limit, 25))
    return [
        ChunkSearchResult(
            id=chunk.id,
            document_id=chunk.document_id,
            chunk_index=chunk.chunk_index,
            text=chunk.text,
            token_count_estimate=chunk.token_count_estimate,
            embedding_model=chunk.embedding_model,
            created_at=chunk.created_at,
            distance=distance,
        )
        for chunk, distance in search_document_chunks(db, payload.query, limit)
    ]
