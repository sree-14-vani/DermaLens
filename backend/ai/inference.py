"""AI inference service: calls the external skin-analysis model endpoint."""
import logging
from typing import Any

import httpx

from config import settings

logger = logging.getLogger(__name__)


async def call_skin_analysis_model(image_bytes: bytes, filename: str, content_type: str) -> dict[str, Any] | None:
    """
    Forwards the image to the configured SKIN_ANALYSIS_MODEL_URL.
    Returns the model's JSON prediction, or None when unavailable/failed.
    The caller must treat None as "analysis pending" — never fabricate results.
    """
    if not settings.analysis_model_configured:
        logger.info("Skin analysis model URL not configured")
        return None

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            files = {"image": (filename, image_bytes, content_type)}
            response = await client.post(settings.skin_analysis_model_url, files=files)
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, dict):
                logger.warning("Model returned non-dict payload")
                return None
            return data
    except httpx.TimeoutException:
        logger.warning("Skin analysis model timed out")
        return None
    except httpx.HTTPError as exc:
        logger.warning("Skin analysis model call failed: %s", exc)
        return None
    except ValueError as exc:
        logger.warning("Skin analysis model returned invalid JSON: %s", exc)
        return None


async def call_enhancement_model(image_bytes: bytes, filename: str, content_type: str) -> bytes | None:
    """
    Forwards the image to the configured IMAGE_ENHANCEMENT_MODEL_URL.
    Returns the enhanced image bytes, or None when unavailable/failed.
    """
    if not settings.enhancement_model_configured:
        logger.info("Enhancement model URL not configured")
        return None

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            files = {"image": (filename, image_bytes, content_type)}
            response = await client.post(settings.image_enhancement_model_url, files=files)
            response.raise_for_status()
            content = response.content
            if not content:
                return None
            return content
    except httpx.TimeoutException:
        logger.warning("Enhancement model timed out")
        return None
    except httpx.HTTPError as exc:
        logger.warning("Enhancement model call failed: %s", exc)
        return None
