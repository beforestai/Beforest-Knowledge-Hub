import httpx

from backend.app.core.config import get_settings


def ask_llm(system_prompt: str, user_prompt: str) -> str:
    settings = get_settings()
    if not settings.llm_api_key:
        raise RuntimeError("LLM_API_KEY is not configured.")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.llm_api_key}",
    }
    payload = {
        "model": settings.llm_model,
        "temperature": 0.2,
        "max_tokens": 800,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }

    with httpx.Client(timeout=60) as client:
        response = client.post(settings.llm_api_url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

    answer = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not answer:
        raise RuntimeError("LLM API returned an empty answer.")
    return answer.strip()
