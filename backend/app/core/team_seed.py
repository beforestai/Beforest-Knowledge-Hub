INITIAL_TEAMS = [
    {"id": "business-intelligence", "name": "Business Intelligence", "slug": "business-intelligence"},
    {"id": "be-wild", "name": "Be Wild", "slug": "be-wild"},
    {"id": "collective-design-and-support", "name": "Collective Design & Support", "slug": "collective-design-and-support"},
    {"id": "community-engagement", "name": "Community Engagement", "slug": "community-engagement"},
    {"id": "admin", "name": "Admin", "slug": "admin"},
    {"id": "hr", "name": "HR", "slug": "hr"},
    {"id": "finance", "name": "Finance", "slug": "finance"},
    {"id": "collective-operations", "name": "Collective Operations", "slug": "collective-operations"},
    {"id": "hospitality", "name": "Hospitality", "slug": "hospitality"},
    {"id": "regolith", "name": "Regolith", "slug": "regolith"},
    {"id": "marketing", "name": "Marketing", "slug": "marketing"},
    {"id": "content-and-storytelling", "name": "Content & Storytelling", "slug": "content-and-storytelling"},
    {"id": "legal-and-liaisoning", "name": "Legal & Liaisoning", "slug": "legal-and-liaisoning"},
]

DEFAULT_USER = {
    "name": "Demo User",
    "email": "demo.user@beforest.local",
    "team_id": "marketing",
}


def team_id_from_name(name: str) -> str:
    for team in INITIAL_TEAMS:
        if team["name"] == name:
            return team["id"]
    return name.strip().lower().replace("&", "and").replace(" ", "-")
