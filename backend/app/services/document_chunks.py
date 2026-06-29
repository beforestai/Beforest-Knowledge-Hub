from uuid import UUID

from pgvector.sqlalchemy import Vector
from sqlalchemy import delete, func, select, text
from sqlalchemy.orm import Session

from backend.app.core.config import get_settings
from backend.app.models.document_chunk import DocumentChunk
from backend.app.services.embeddings import embed_chunks


def replace_document_chunks(db: Session, document_id: UUID, chunks: list[str], embeddings: list[list[float]]) -> int:
    if len(chunks) != len(embeddings):
        raise ValueError("Chunk and embedding counts do not match.")

    db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))
    settings = get_settings()
    for index, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        db.add(
            DocumentChunk(
                document_id=document_id,
                chunk_index=index,
                text=chunk,
                token_count_estimate=max(1, len(chunk) // 4),
                embedding_model=settings.embedding_model_name,
                embedding=embedding,
            )
        )
    db.commit()
    return len(chunks)


def count_document_chunks(db: Session, document_id: UUID) -> int:
    return db.scalar(select(func.count()).where(DocumentChunk.document_id == document_id)) or 0


def list_document_chunks(db: Session, document_id: UUID) -> list[DocumentChunk]:
    return list(db.scalars(select(DocumentChunk).where(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index)).all())


def search_document_chunks(db: Session, query: str, limit: int = 8) -> list[tuple[DocumentChunk, float]]:
    embedding = embed_chunks([query])[0]
    distance = DocumentChunk.embedding.cosine_distance(embedding).label("distance")
    rows = db.execute(select(DocumentChunk, distance).order_by(distance).limit(limit)).all()
    return [(row[0], float(row[1])) for row in rows]
