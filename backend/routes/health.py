"""Health route."""
from fastapi import APIRouter

from config import settings
from schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/api/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        analysis_model_configured=settings.analysis_model_configured,
        enhancement_model_configured=settings.enhancement_model_configured,
        ai_provider_configured=settings.ai_provider_configured,
    )
