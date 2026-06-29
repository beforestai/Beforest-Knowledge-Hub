from uuid import UUID

from backend.app.schemas.document import CamelModel


class ChatAskRequest(CamelModel):
    question: str
    limit: int = 6


class ChatCitation(CamelModel):
    document_id: UUID
    title: str
    slug: str
    team_id: str
    team: str
    category: str
    summary: str
    file_type: str
    file_name: str
    source_link: str
    updated: str
    chunk_id: UUID
    chunk_index: int
    chunk_text: str
    citation_link: str
    distance: float


class ChatAskResponse(CamelModel):
    answer: str
    citations: list[ChatCitation]
