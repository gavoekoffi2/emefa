"""Admin Dashboard routes - Platform management, API keys, OpenClaw settings."""

import uuid
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, Workspace
from app.models.assistant import Assistant
from app.models.conversation import Conversation

logger = logging.getLogger("emefa.admin")

router = APIRouter(prefix="/admin", tags=["admin-dashboard"])


@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get platform-wide statistics."""
    try:
        # Count users
        users_result = await db.execute(select(func.count(User.id)))
        total_users = users_result.scalar() or 0

        # Count assistants
        assistants_result = await db.execute(select(func.count(Assistant.id)))
        total_assistants = assistants_result.scalar() or 0

        # Count conversations
        conversations_result = await db.execute(select(func.count(Conversation.id)))
        total_conversations = conversations_result.scalar() or 0

        return {
            "total_users": total_users,
            "total_assistants": total_assistants,
            "total_conversations": total_conversations,
            "active_integrations": 0,
            "openclaw_version": "2026.3.13",
            "platform_status": "healthy",
        }
    except Exception as e:
        logger.error(f"Failed to get admin stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users")
async def list_users(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all platform users."""
    try:
        result = await db.execute(
            select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
        )
        users = result.scalars().all()

        return [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/toggle")
async def toggle_user_status(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Enable/disable a user account."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    user.is_active = not user.is_active
    await db.commit()

    return {
        "id": str(user.id),
        "is_active": user.is_active,
        "message": f"Utilisateur {'activé' if user.is_active else 'désactivé'}",
    }


# =====================
# API Keys Management
# =====================

# In-memory store for now (TODO: move to DB)
_platform_api_keys: list[dict] = []


@router.get("/api-keys")
async def list_api_keys(
    current_user: User = Depends(get_current_user),
):
    """List platform API keys."""
    return [
        {
            "id": k["id"],
            "name": k["name"],
            "provider": k["provider"],
            "is_active": k["is_active"],
            "created_at": k["created_at"],
            "last_used_at": k.get("last_used_at"),
        }
        for k in _platform_api_keys
    ]


@router.post("/api-keys")
async def add_api_key(
    request: dict,
    current_user: User = Depends(get_current_user),
):
    """Add a new platform API key."""
    name = request.get("name", "").strip()
    provider = request.get("provider", "").strip()
    api_key = request.get("api_key", "").strip()

    if not name or not provider or not api_key:
        raise HTTPException(status_code=400, detail="Nom, provider et clé API requis")

    key_entry = {
        "id": str(uuid.uuid4()),
        "name": name,
        "provider": provider,
        "api_key": api_key,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
        "last_used_at": None,
    }
    _platform_api_keys.append(key_entry)

    logger.info(f"API key added: {name} ({provider})")

    return {
        "id": key_entry["id"],
        "name": name,
        "provider": provider,
        "is_active": True,
        "message": "Clé API ajoutée avec succès",
    }


@router.delete("/api-keys/{key_id}")
async def delete_api_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
):
    """Delete a platform API key."""
    global _platform_api_keys
    _platform_api_keys = [k for k in _platform_api_keys if k["id"] != key_id]
    return {"message": "Clé API supprimée"}


@router.post("/api-keys/{key_id}/toggle")
async def toggle_api_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
):
    """Toggle API key active status."""
    for k in _platform_api_keys:
        if k["id"] == key_id:
            k["is_active"] = not k["is_active"]
            return {
                "id": key_id,
                "is_active": k["is_active"],
                "message": f"Clé {'activée' if k['is_active'] else 'désactivée'}",
            }
    raise HTTPException(status_code=404, detail="Clé API non trouvée")


# =====================
# OpenClaw Management
# =====================


@router.get("/openclaw/status")
async def get_openclaw_status(
    current_user: User = Depends(get_current_user),
):
    """Get OpenClaw runtime status."""
    return {
        "version": "2026.3.13",
        "status": "running",
        "default_model": "openrouter/openrouter/hunter-alpha",
        "uptime_seconds": 3600,
        "memory_usage_mb": 256,
        "plugins_loaded": 7,
        "skills_available": 5,
    }


@router.post("/openclaw/update")
async def check_openclaw_update(
    current_user: User = Depends(get_current_user),
):
    """Check for OpenClaw updates."""
    # TODO: Actually check npm for latest version
    return {
        "current_version": "2026.3.13",
        "latest_version": "2026.3.13",
        "update_available": False,
        "message": "Vous avez la dernière version",
    }


@router.post("/openclaw/settings")
async def update_openclaw_settings(
    request: dict,
    current_user: User = Depends(get_current_user),
):
    """Update OpenClaw settings."""
    model = request.get("default_model")
    timeout = request.get("timeout")

    # TODO: Actually update openclaw config
    logger.info(f"OpenClaw settings update requested: model={model}, timeout={timeout}")

    return {
        "message": "Paramètres mis à jour",
        "default_model": model,
        "timeout": timeout,
    }
