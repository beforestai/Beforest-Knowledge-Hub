from functools import lru_cache

from backend.app.core.config import get_settings


@lru_cache(maxsize=1)
def get_embedding_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(get_settings().embedding_model_name)


def embed_chunks(chunks: list[str]) -> list[list[float]]:
    if not chunks:
        return []
    model = get_embedding_model()
    embeddings = model.encode(
        chunks,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return [embedding.tolist() for embedding in embeddings]
