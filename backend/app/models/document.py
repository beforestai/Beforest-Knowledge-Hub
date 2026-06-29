import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Index, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.db.session import Base


class Document(Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_team", "team"),
        Index("ix_documents_category", "category"),
        Index("ix_documents_updated", "updated"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    slug: Mapped[str] = mapped_column(String(280), nullable=False, unique=True)
    team: Mapped[str] = mapped_column(String(120), nullable=False)
    team_id: Mapped[str] = mapped_column(String(120), ForeignKey("teams.id"), nullable=False)
    category: Mapped[str] = mapped_column(String(120), nullable=False, default="Knowledge Page")
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    file_type: Mapped[str] = mapped_column(String(80), nullable=False, default="Text Page")
    file_name: Mapped[str] = mapped_column(String(260), nullable=False, default="No supporting file attached")
    file_storage_path: Mapped[str] = mapped_column(Text, nullable=False, default="")
    file_size_bytes: Mapped[int | None] = mapped_column(nullable=True)
    file_content_type: Mapped[str] = mapped_column(String(160), nullable=False, default="")
    ingestion_status: Mapped[str] = mapped_column(String(40), nullable=False, default="not_required")
    ingestion_job_id: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    ingestion_error: Mapped[str] = mapped_column(Text, nullable=False, default="")
    ingestion_chunk_count: Mapped[int] = mapped_column(nullable=False, default=0)
    ingested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    related_teams: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)
    source_link: Mapped[str] = mapped_column(Text, nullable=False, default="")
    updated: Mapped[date] = mapped_column(Date, nullable=False, server_default=func.current_date())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
