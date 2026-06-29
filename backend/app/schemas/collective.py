from backend.app.schemas.document import CamelModel


class CollectiveOverviewRequest(CamelModel):
    name: str
    url: str


class CollectiveOverviewResponse(CamelModel):
    overview: str
    source_url: str
