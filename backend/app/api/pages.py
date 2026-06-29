from fastapi import APIRouter

from backend.app.api.documents import (
    create_document_endpoint,
    delete_document_endpoint,
    get_document_endpoint,
    list_document_endpoint,
    upload_document_file_endpoint,
    update_document_endpoint,
)

router = APIRouter(prefix="/pages", tags=["pages"])

router.add_api_route("", list_document_endpoint, methods=["GET"])
router.add_api_route("", create_document_endpoint, methods=["POST"])
router.add_api_route("/{document_id}", get_document_endpoint, methods=["GET"])
router.add_api_route("/{document_id}", update_document_endpoint, methods=["PATCH"])
router.add_api_route("/{document_id}", delete_document_endpoint, methods=["DELETE"])
router.add_api_route("/{document_id}/file", upload_document_file_endpoint, methods=["POST"])
