from datetime import date
from uuid import UUID

from sqlalchemy import Select, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.models.document import Document
from backend.app.schemas.document import DocumentCreate, DocumentUpdate


def attachment_debug(document: Document) -> dict[str, object]:
    return {
        "id": str(document.id),
        "title": document.title,
        "file_name": document.file_name,
        "file_storage_path": document.file_storage_path,
        "file_content_type": document.file_content_type,
        "file_size_bytes": document.file_size_bytes,
    }


def slugify(value: str) -> str:
    chars: list[str] = []
    previous_dash = False
    for char in value.strip().lower().replace("&", "and"):
        if char.isalnum():
            chars.append(char)
            previous_dash = False
        elif not previous_dash:
            chars.append("-")
            previous_dash = True
    return "".join(chars).strip("-") or "untitled"


def build_document_query(
    *,
    search: str | None = None,
    team: str | None = None,
    category: str | None = None,
) -> Select[tuple[Document]]:
    statement = select(Document)
    if team:
        statement = statement.where(Document.team == team)
    if category:
        statement = statement.where(Document.category == category)
    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Document.title.ilike(pattern),
                Document.summary.ilike(pattern),
                Document.content.ilike(pattern),
                Document.team.ilike(pattern),
                Document.category.ilike(pattern),
            )
        )
    return statement


def list_documents(
    db: Session,
    *,
    search: str | None = None,
    team: str | None = None,
    category: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Document], int]:
    base_query = build_document_query(search=search, team=team, category=category)
    total = db.scalar(select(func.count()).select_from(base_query.subquery())) or 0
    documents = db.scalars(base_query.order_by(Document.updated.desc(), Document.created_at.desc()).limit(limit).offset(offset)).all()
    return list(documents), total


def get_document(db: Session, document_id: UUID) -> Document | None:
    return db.get(Document, document_id)


def create_document(db: Session, payload: DocumentCreate) -> Document:
    data = payload.model_dump(by_alias=False)
    data["slug"] = data["slug"] or slugify(data["title"])
    data["updated"] = data["updated"] or date.today()
    document = Document(**data)
    print(
        "[KMS attachment:backend row before save]",
        {
            "id": None,
            "title": document.title,
            "file_name": document.file_name,
            "file_storage_path": document.file_storage_path,
            "file_content_type": document.file_content_type,
            "file_size_bytes": document.file_size_bytes,
        },
        flush=True,
    )
    db.add(document)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(document)
    print("[KMS attachment:backend row after save]", attachment_debug(document), flush=True)
    return document


def set_document_ingestion_job(db: Session, document: Document, job_id: str) -> Document:
    document.ingestion_status = "queued"
    document.ingestion_job_id = job_id
    document.ingestion_error = ""
    db.commit()
    db.refresh(document)
    return document


def mark_document_ingestion_enqueue_failed(db: Session, document: Document, error: str) -> Document:
    document.ingestion_status = "enqueue_failed"
    document.ingestion_error = error
    db.commit()
    db.refresh(document)
    return document


def update_document(db: Session, document: Document, payload: DocumentUpdate) -> Document:
    updates = payload.model_dump(exclude_unset=True, by_alias=False)
    if updates.get("slug") == "":
        updates["slug"] = slugify(updates.get("title") or document.title)
    for key, value in updates.items():
        setattr(document, key, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(document)
    return document


def delete_document(db: Session, document: Document) -> None:
    db.delete(document)
    db.commit()
