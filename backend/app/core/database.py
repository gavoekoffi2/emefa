"""Database engine and session management."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

_engine_kwargs = {
    "echo": settings.DATABASE_ECHO,
}
# SQLite doesn't support pool_size / max_overflow
if not settings.DATABASE_URL.startswith("sqlite"):
    _engine_kwargs["pool_size"] = 20
    _engine_kwargs["max_overflow"] = 10

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
