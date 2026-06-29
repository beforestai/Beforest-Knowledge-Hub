from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/beforest_kms"
    api_cors_origins: str = "http://127.0.0.1:3000,http://localhost:3000"
    upload_dir: str = "/app/uploads"
    redis_url: str = "redis://127.0.0.1:6379/0"
    ingestion_queue_name: str = "kms-document-ingestion"
    embedding_model_name: str = "BAAI/bge-base-en-v1.5"
    embedding_dimensions: int = 768
    chunk_target_chars: int = 1200
    chunk_overlap_chars: int = 180
    llm_api_url: str = "https://api.openai.com/v1/chat/completions"
    llm_api_key: str = ""
    llm_model: str = "gpt-4o-mini"

    model_config = SettingsConfigDict(env_file="backend/.env", env_file_encoding="utf-8")

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.api_cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
