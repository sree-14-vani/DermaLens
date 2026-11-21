"""Chatbot service: server-side AI provider integration.

Uses an OpenAI-compatible chat completions API. The API key lives only in the
backend environment — it is never exposed to the frontend.
If no key is configured, the caller must surface a clear "not configured"
message rather than pretending the assistant is a live AI.
"""
import logging

import httpx

from config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are AcneClear's skincare assistant. You give friendly, evidence-informed "
    "general skincare guidance: routines, acne care education, ingredient explanations, "
    "hydration and diet habits. You never diagnose medical conditions, never prescribe "
    "medication, and always recommend a dermatologist for persistent or severe concerns. "
    "Answer in the user's language (English, Kannada, Hindi or Telugu). Keep answers "
    "concise, warm and practical."
)


async def get_ai_reply(message: str, history: list[dict], language: str = "en") -> str | None:
    """
    Returns the AI reply, or None when the provider is not configured/unreachable.
    """
    if not settings.ai_provider_configured:
        logger.info("AI provider not configured")
        return None

    lang_names = {"en": "English", "kn": "Kannada", "hi": "Hindi", "te": "Telugu"}
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"Respond in {lang_names.get(language, 'English')}."},
        *history[-20:],
        {"role": "user", "content": message},
    ]

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                f"{settings.ai_provider_base_url}/chat/completions",
                headers={"Authorization": f"Bearer {settings.ai_provider_api_key}"},
                json={
                    "model": settings.ai_provider_model,
                    "messages": messages,
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
            )
            response.raise_for_status()
            data = response.json()
            reply = data.get("choices", [{}])[0].get("message", {}).get("content")
            return reply if isinstance(reply, str) and reply.strip() else None
    except httpx.HTTPError as exc:
        logger.warning("AI provider call failed: %s", exc)
        return None
