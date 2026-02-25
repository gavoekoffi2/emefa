"""EMEFA Platform - Main FastAPI Application."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes import actions, admin, assistants, auth, chat, knowledge, livekit, telegram, whatsapp
from app.core.config import get_settings
from app.core.database import engine, Base

# Import all models so Base.metadata knows about them
from app.models import user, assistant, knowledge as kb_models, conversation, audit  # noqa: F401

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
    yield
    logger.info("EMEFA Platform shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="EMEFA - Plateforme SaaS d'assistants IA",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Workspace-ID"],
)

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


@app.get("/health")
async def health():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}
