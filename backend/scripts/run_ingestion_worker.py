from redis import Redis
from rq import Worker

from backend.app.core.config import get_settings


def main() -> None:
    settings = get_settings()
    redis_connection = Redis.from_url(settings.redis_url)
    worker = Worker([settings.ingestion_queue_name], connection=redis_connection)
    worker.work()


if __name__ == "__main__":
    main()
