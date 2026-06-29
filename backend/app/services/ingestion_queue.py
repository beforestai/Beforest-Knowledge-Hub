from uuid import UUID

from redis import Redis
from rq import Queue

from backend.app.core.config import get_settings
from backend.app.workers.document_ingestion import process_document_ingestion


def get_redis_connection() -> Redis:
    return Redis.from_url(get_settings().redis_url)


def get_ingestion_queue() -> Queue:
    return Queue(get_settings().ingestion_queue_name, connection=get_redis_connection())


def enqueue_document_ingestion(document_id: UUID, file_storage_path: str) -> str:
    job = get_ingestion_queue().enqueue(
        process_document_ingestion,
        str(document_id),
        file_storage_path,
        job_timeout="10m",
        result_ttl=86400,
        failure_ttl=604800,
    )
    return job.id
