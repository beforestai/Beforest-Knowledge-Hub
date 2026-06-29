from datetime import date, datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    words = value.split("_")
    return words[0] + "".join(word.capitalize() for word in words[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, from_attributes=True, populate_by_name=True)


class DocumentBase(CamelModel):
    title: Annotated[str, Field(min_length=1, max_length=240)]
    slug: Annotated[str | None, Field(default=None, max_length=280)]
    team: Annotated[str, Field(min_length=1, max_length=120)]
    team_id: Annotated[str, Field(min_length=1, max_length=120)]
    category: Annotated[str, Field(default="Knowledge Page", max_length=120)]
    summary: Annotated[str, Field(min_length=1)]
    content: str = ""
    file_type: Annotated[str, Field(default="Text Page", max_length=80)]
    file_name: Annotated[str, Field(default="No supporting file attached", max_length=260)]
    file_storage_path: str = ""
    file_size_bytes: int | None = None
    file_content_type: Annotated[str, Field(default="", max_length=160)]
    ingestion_status: Annotated[str, Field(default="not_required", max_length=40)]
    ingestion_job_id: Annotated[str, Field(default="", max_length=120)]
    ingestion_error: str = ""
    ingestion_chunk_count: int = 0
    ingested_at: datetime | None = None
    tags: list[str] = Field(default_factory=list)
    related_teams: list[str] = Field(default_factory=list)
    source_link: str = ""
    updated: date | None = None


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(CamelModel):
    title: Annotated[str | None, Field(default=None, min_length=1, max_length=240)]
    slug: Annotated[str | None, Field(default=None, max_length=280)]
    category: Annotated[str | None, Field(default=None, max_length=120)]
    summary: Annotated[str | None, Field(default=None, min_length=1)]
    content: str | None = None
    file_type: Annotated[str | None, Field(default=None, max_length=80)]
    file_name: Annotated[str | None, Field(default=None, max_length=260)]
    tags: list[str] | None = None
    related_teams: list[str] | None = None
    source_link: str | None = None
    updated: date | None = None


class DocumentRead(CamelModel):
    id: UUID
    title: str
    slug: str
    team_id: str
    team: str
    category: str
    summary: str
    content: str
    file_type: str
    file_name: str
    file_storage_path: str
    file_size_bytes: int | None
    file_content_type: str
    ingestion_status: str
    ingestion_job_id: str
    ingestion_error: str
    ingestion_chunk_count: int
    ingested_at: datetime | None
    tags: list[str]
    related_teams: list[str]
    source_link: str
    updated: date
    created_at: datetime
    updated_at: datetime


class DocumentList(CamelModel):
    items: list[DocumentRead]
    total: int
    limit: int
    offset: int
