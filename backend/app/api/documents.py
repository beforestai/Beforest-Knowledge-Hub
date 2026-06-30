from uuid import UUID

from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.core.current_user import CurrentUser, get_current_user
from backend.app.schemas.document import DocumentCreate, DocumentList, DocumentRead, DocumentUpdate
from backend.app.services.documents import (
    attachment_debug,
    create_document,
    delete_document,
    get_document,
    list_documents,
    mark_document_ingestion_enqueue_failed,
    set_document_ingestion_job,
    update_document,
)
from backend.app.services.ingestion_queue import enqueue_document_ingestion
from backend.app.services.uploads import save_upload_file

router = APIRouter(prefix="/documents", tags=["documents"])


def parse_list_field(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def ensure_same_team(document: DocumentRead, current_user: CurrentUser) -> None:
    if document.team_id != current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This page belongs to another team and can only be viewed.",
        )


@router.get("", response_model=DocumentList)
def list_document_endpoint(
    search: str | None = None,
    team: str | None = None,
    category: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> DocumentList:
    documents, total = list_documents(db, search=search, team=team, category=category, limit=limit, offset=offset)
    return DocumentList(items=documents, total=total, limit=limit, offset=offset)


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def create_document_endpoint(
    title: str = Form(...),
    summary: str = Form(...),
    slug: str | None = Form(None),
    category: str = Form("Knowledge Page"),
    content: str = Form(""),
    file_type: str = Form("Text Page"),
    file_name: str = Form("No supporting file attached"),
    tags: str = Form(""),
    related_teams: str = Form(""),
    source_link: str = Form(""),
    updated: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> DocumentRead:
    payload_data = {
        "title": title,
        "slug": slug,
        "team": current_user.team,
        "team_id": current_user.team_id,
        "category": category,
        "summary": summary,
        "content": content,
        "file_type": file_type,
        "file_name": file_name,
        "tags": parse_list_field(tags),
        "related_teams": parse_list_field(related_teams),
        "source_link": source_link,
        "updated": updated,
    }
    if file and file.filename:
        payload_data.update(save_upload_file(file))
        payload_data["ingestion_status"] = "pending_enqueue"

    payload = DocumentCreate(**payload_data)
    try:
        document = create_document(db, payload)
    except IntegrityError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A document with this slug already exists.") from exc

    if document.file_storage_path:
        try:
            job_id = enqueue_document_ingestion(document.id, document.file_storage_path)
            document = set_document_ingestion_job(db, document, job_id)
        except Exception as exc:
            document = mark_document_ingestion_enqueue_failed(db, document, str(exc))

    print("[KMS attachment:backend create response]", attachment_debug(document), flush=True)
    return document


@router.get("/{document_id}", response_model=DocumentRead)
def get_document_endpoint(document_id: UUID, db: Session = Depends(get_db)) -> DocumentRead:
    document = get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return document


@router.get("/{document_id}/file")
def get_document_file_endpoint(document_id: UUID, db: Session = Depends(get_db)) -> FileResponse:
    document = get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    if not document.file_storage_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No supporting file attached.")

    file_path = Path(document.file_storage_path)
    if not file_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supporting file not found.")

    return FileResponse(
        path=file_path,
        media_type=document.file_content_type or None,
        filename=document.file_name,
        content_disposition_type="inline",
    )


@router.patch("/{document_id}", response_model=DocumentRead)
def update_document_endpoint(
    document_id: UUID,
    payload: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> DocumentRead:
    document = get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    ensure_same_team(document, current_user)
    try:
        return update_document(db, document, payload)
    except IntegrityError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A document with this slug already exists.") from exc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document_endpoint(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Response:
    document = get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    ensure_same_team(document, current_user)
    delete_document(db, document)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{document_id}/file", response_model=DocumentRead)
def upload_document_file_endpoint(
    document_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> DocumentRead:
    document = get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    ensure_same_team(document, current_user)

    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A file is required.")

    upload_data = save_upload_file(file)
    payload = DocumentUpdate(
        file_type=upload_data["file_type"],
        file_name=upload_data["file_name"],
    )
    document.file_storage_path = str(upload_data["file_storage_path"])
    document.file_size_bytes = upload_data["file_size_bytes"]  # type: ignore[assignment]
    document.file_content_type = str(upload_data["file_content_type"])
    document.ingestion_status = "pending_enqueue"
    document.ingestion_job_id = ""
    document.ingestion_error = ""
    document.ingestion_chunk_count = 0
    document = update_document(db, document, payload)

    try:
        job_id = enqueue_document_ingestion(document.id, document.file_storage_path)
        return set_document_ingestion_job(db, document, job_id)
    except Exception as exc:
        return mark_document_ingestion_enqueue_failed(db, document, str(exc))
