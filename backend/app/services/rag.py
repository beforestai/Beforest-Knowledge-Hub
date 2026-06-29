from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.document import Document
from backend.app.schemas.chat import ChatAskResponse, ChatCitation
from backend.app.services.document_chunks import search_document_chunks
from backend.app.services.documents import slugify
from backend.app.services.llm_client import ask_llm


def citation_link_for(document: Document) -> str:
    return f"/kms/{slugify(document.team)}/{document.slug or document.id}"


def answer_question(db: Session, question: str, limit: int = 6) -> ChatAskResponse:
    ranked_chunks = search_document_chunks(db, question, limit=max(1, min(limit, 12)))
    if not ranked_chunks:
        return ChatAskResponse(
            answer="The KMS does not contain enough ingested information to answer this question yet.",
            citations=[],
        )

    document_ids = {chunk.document_id for chunk, _distance in ranked_chunks}
    documents = {
        document.id: document
        for document in db.scalars(select(Document).where(Document.id.in_(document_ids))).all()
    }

    context_blocks: list[str] = []
    citations: list[ChatCitation] = []
    for index, (chunk, distance) in enumerate(ranked_chunks, start=1):
        document = documents.get(chunk.document_id)
        if not document:
            continue
        link = citation_link_for(document)
        context_blocks.append(
            "\n".join(
                [
                    f"[{index}] {document.title}",
                    f"Team: {document.team}",
                    f"Category: {document.category}",
                    f"Citation link: {link}",
                    f"Chunk: {chunk.text}",
                ]
            )
        )
        citations.append(
            ChatCitation(
                document_id=document.id,
                title=document.title,
                slug=document.slug,
                team_id=document.team_id,
                team=document.team,
                category=document.category,
                summary=document.summary,
                file_type=document.file_type,
                file_name=document.file_name,
                source_link=document.source_link,
                updated=document.updated.isoformat(),
                chunk_id=chunk.id,
                chunk_index=chunk.chunk_index,
                chunk_text=chunk.text,
                citation_link=link,
                distance=distance,
            )
        )

    if not context_blocks:
        return ChatAskResponse(
            answer="The KMS does not contain enough ingested information to answer this question yet.",
            citations=[],
        )

    system_prompt = (
        "You are the Beforest KMS assistant. Answer only from the supplied retrieved KMS chunks. "
        "If the chunks do not support the answer, say the KMS does not contain enough information. "
        "Keep the answer concise, business-useful, and do not invent facts. "
        "Reference supporting sources inline using bracket numbers like [1] or [2]."
    )
    user_prompt = f"Question: {question}\n\nRetrieved KMS chunks:\n\n" + "\n\n".join(context_blocks)
    answer = ask_llm(system_prompt, user_prompt)

    return ChatAskResponse(answer=answer, citations=citations)
