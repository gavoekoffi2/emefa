"""EMEFA Platform - Main FastAPI Application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response as StarletteResponse

from app.api.routes import (
    actions, admin, architect, assistants, auth, bridge, chat,
    knowledge, livekit, telegram, templates, whatsapp, workspace, skills,
)
from app.core.config import get_settings
from app.core.database import engine, async_session, Base

# Import all models so Base.metadata knows about them
from app.models import user, assistant, knowledge as kb_models, conversation, audit, template as tpl_models, skill as skill_models  # noqa: F401

settings = get_settings()

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("emefa")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("EMEFA Platform starting up...")
    # Auto-create tables if they don't exist (dev convenience)
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
            ))
            tables_exist = result.scalar()
            if not tables_exist:
                logger.info("Database tables not found - creating schema...")
                await conn.run_sync(Base.metadata.create_all)
                logger.info("Database schema created successfully.")
            else:
                logger.info("Database tables already exist.")
    except Exception as e:
        logger.warning(f"Could not auto-create tables (DB may not be ready): {e}")

    # Seed built-in templates
    try:
        from app.services.template_service import seed_templates
        async with async_session() as db:
            await seed_templates(db)
            logger.info("Built-in templates seeded.")
    except Exception as e:
        logger.warning(f"Could not seed templates: {e}")

    # Seed official skills
    try:
        from app.services.skills_service import SkillsService
        async with async_session() as db:
            await SkillsService.seed_official_skills(db)
            logger.info("Official skills seeded.")
    except Exception as e:
        logger.warning(f"Could not seed official skills: {e}")

    # Validate configuration
    issues = settings.validate_for_production()
    for issue in issues:
        logger.warning(f"CONFIGURATION WARNING: {issue}")

    yield
    logger.info("EMEFA Platform shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="EMEFA - Plateforme SaaS d'assistants IA",
    lifespan=lifespan,
)

# Rate Limiting (must be added before CORS so it runs after CORS in middleware stack)
from app.core.rate_limit import RateLimitMiddleware  # noqa: E402
app.add_middleware(RateLimitMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Workspace-ID"],
)

# Security Headers
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()"
        if not settings.DEBUG:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(assistants.router, prefix="/api/v1")
app.include_router(knowledge.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(livekit.router, prefix="/api/v1")
app.include_router(telegram.router, prefix="/api/v1")
app.include_router(whatsapp.router, prefix="/api/v1")
app.include_router(whatsapp.qr_router, prefix="/api/v1")
app.include_router(actions.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(workspace.router, prefix="/api/v1")
app.include_router(templates.router, prefix="/api/v1")
app.include_router(bridge.router, prefix="/api/v1")
app.include_router(architect.router, prefix="/api/v1")
app.include_router(skills.router, prefix="/api/v1")


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    if "UUID" in str(exc) or "badly formed" in str(exc):
        return JSONResponse(status_code=400, content={"detail": "Invalid ID format"})
    raise exc


@app.get("/health")
async def health():
    health_status = {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}
    # Check database connectivity
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as e:
        health_status["status"] = "degraded"
        health_status["database"] = f"error: {str(e)[:100]}"
    return health_status
