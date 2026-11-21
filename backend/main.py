"""AcneClear FastAPI application entrypoint."""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from utils.logging_config import setup_logging
from routes.analysis import router as analysis_router
from routes.enhancement import router as enhancement_router
from routes.routines import router as routines_router
from routes.tips import router as tips_router
from routes.diet import router as diet_router
from routes.chat import router as chat_router
from routes.profile import router as profile_router
from routes.health import router as health_router

setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AcneClear API",
    description=(
        "AI-Powered Personalized Skin Analysis and Skincare Assistant. "
        "All protected endpoints require a Supabase JWT in the Authorization header."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health_router)
app.include_router(analysis_router)
app.include_router(enhancement_router)
app.include_router(routines_router)
app.include_router(tips_router)
app.include_router(diet_router)
app.include_router(chat_router)
app.include_router(profile_router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
    return response
