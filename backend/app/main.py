from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.chat import router as chat_router
from backend.app.api.chunks import router as chunks_router
from backend.app.api.collective import router as collective_router
from backend.app.api.documents import router as documents_router
from backend.app.api.pages import router as pages_router
from backend.app.api.teams import router as teams_router
from backend.app.api.users import router as users_router
from backend.app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="Beforest KMS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(documents_router, prefix="/api/v1")
app.include_router(pages_router, prefix="/api/v1")
app.include_router(chunks_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(teams_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(collective_router, prefix="/api/v1")
