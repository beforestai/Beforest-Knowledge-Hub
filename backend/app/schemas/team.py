from datetime import datetime

from backend.app.schemas.document import CamelModel


class TeamRead(CamelModel):
    id: str
    name: str
    slug: str
    created_at: datetime
    updated_at: datetime


class TeamList(CamelModel):
    items: list[TeamRead]
