from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx

from backend.app.services.llm_client import ask_llm


ALLOWED_HOSTS = {
    "beforest.co",
    "www.beforest.co",
    "experiences.beforest.co",
    "hospitality.beforest.co",
    "bewild.life",
    "www.bewild.life",
}


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._skip_depth = 0
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style", "noscript", "svg"}:
            self._skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in {"script", "style", "noscript", "svg"} and self._skip_depth:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        text = " ".join(data.split())
        if not self._skip_depth and text:
            self.parts.append(text)

    def text(self) -> str:
        return "\n".join(self.parts)


def validate_source_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or parsed.netloc.lower() not in ALLOWED_HOSTS:
        raise ValueError("Only approved Beforest source URLs can be summarized.")


def fetch_page_text(url: str) -> str:
    validate_source_url(url)
    with httpx.Client(timeout=30, follow_redirects=True) as client:
        response = client.get(url, headers={"User-Agent": "BeforestKMSBot/1.0"})
        response.raise_for_status()

    parser = TextExtractor()
    parser.feed(response.text)
    return parser.text()[:12000]


def generate_collective_overview(name: str, url: str) -> str:
    page_text = fetch_page_text(url)
    if not page_text:
        raise RuntimeError("The source page did not contain readable text.")

    system_prompt = (
        "You are the Beforest KMS assistant. Summarize only from the provided webpage text. "
        "Do not invent facts. Write plain internal knowledge-base language."
    )
    user_prompt = (
        f"Page name: {name}\n"
        f"Source URL: {url}\n\n"
        "Write a 3-5 sentence overview. For collectives, mention what it is, where it is, "
        "and what makes it distinct if the source text supports it. Start directly with the overview.\n\n"
        f"Webpage text:\n{page_text}"
    )
    return ask_llm(system_prompt, user_prompt)
