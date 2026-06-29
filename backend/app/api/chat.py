from fastapi import APIRouter, Depends, HTTPException, status
from httpx import HTTPError
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.schemas.chat import ChatAskRequest, ChatAskResponse
from backend.app.services.rag import answer_question

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/ask", response_model=ChatAskResponse)
def ask_chat_endpoint(payload: ChatAskRequest, db: Session = Depends(get_db)) -> ChatAskResponse:
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question is required.")
    try:
        return answer_question(db, question, limit=payload.limit)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except HTTPError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="LLM API request failed.") from exc
