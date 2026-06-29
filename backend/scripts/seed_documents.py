from datetime import date

from sqlalchemy import select

from backend.app.db.session import SessionLocal
from backend.app.models.document import Document

SEED_DOCUMENTS = [
    {
        "title": "Monthly Collective Metrics Guide",
        "slug": "monthly-collective-metrics-guide",
        "team": "Business Intelligence",
        "team_id": "business-intelligence",
        "category": "Reports",
        "summary": "Explains common BI metrics used by other teams when reading collective reports.",
        "content": "Overview of monthly collective metrics, how teams should read them, and where to use each metric.",
        "file_type": "Text Page",
        "file_name": "monthly-collective-metrics-guide",
        "tags": ["metrics", "collectives", "reports"],
        "related_teams": ["CDS", "Operations", "Marketing"],
        "source_link": "https://example.com/metrics",
        "updated": date(2026, 6, 5),
        "ingestion_status": "not_required",
        "ingestion_chunk_count": 0,
    },
    {
        "title": "Collective Onboarding Reference",
        "slug": "collective-onboarding-reference",
        "team": "Collective Design & Support",
        "team_id": "collective-design-and-support",
        "category": "Collective-wise Information",
        "summary": "Shared collective reference explaining how a new collective moves from design to support.",
        "content": "Reference page for collective stages, handoffs, operational context, and responsibilities during collective onboarding.",
        "file_type": "PDF",
        "file_name": "collective-onboarding-reference.pdf",
        "tags": ["onboarding", "collective design", "support"],
        "related_teams": ["Community Engagement", "Operations"],
        "source_link": "",
        "updated": date(2026, 6, 3),
        "ingestion_status": "not_required",
        "ingestion_chunk_count": 0,
    },
    {
        "title": "Reimbursement Process",
        "slug": "reimbursement-process",
        "team": "Finance",
        "team_id": "finance",
        "category": "Policy",
        "summary": "Steps, required fields, and timelines for team reimbursement requests.",
        "content": "Finance process page describing reimbursement steps, required proofs, timelines, and support points.",
        "file_type": "Document",
        "file_name": "reimbursement-process.docx",
        "tags": ["finance", "reimbursement", "policy"],
        "related_teams": ["All teams"],
        "source_link": "",
        "updated": date(2026, 5, 28),
        "ingestion_status": "not_required",
        "ingestion_chunk_count": 0,
    },
]


def main() -> None:
    with SessionLocal() as db:
        for item in SEED_DOCUMENTS:
            exists = db.scalar(select(Document).where(Document.slug == item["slug"]))
            if not exists:
                db.add(Document(**item))
        db.commit()
    print("KMS seed documents inserted.")


if __name__ == "__main__":
    main()
