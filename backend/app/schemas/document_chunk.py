from datetime import datetime
from uuid import UUID

from backend.app.schemas.document import CamelModel


class DocumentChunkRead(CamelModel):
    id: UUID
    document_id: UUID
    chunk_index: int
    text: str
    token_count_estimate: int
    embedding_model: str
    created_at: datetime


class ChunkSearchRequest(CamelModel):
    query: str
    limit: int = 8


class ChunkSearchResult(DocumentChunkRead):
    distance: float
