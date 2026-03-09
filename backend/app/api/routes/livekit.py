"""LiveKit routes - voice call token generation."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_workspace
from app.models.assistant import Assistant
from app.models.user import User, Workspace
from app.services.livekit_service import generate_agent_token, generate_livekit_token

router = APIRouter(prefix="/livekit", tags=["livekit"])


def _parse_uuid(value: str, name: str = "ID") -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except (ValueError, AttributeError):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid {name} format")


class LiveKitTokenRequest(BaseModel):
    assistant_id: str


class LiveKitTokenResponse(BaseModel):
    token: str
    room_name: str
    livekit_url: str
    agent_token: str


@router.post("/token", response_model=LiveKitTokenResponse)
async def get_voice_token(
    req: LiveKitTokenRequest,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify assistant belongs to workspace
    result = await db.execute(
        select(Assistant).where(
            Assistant.id == _parse_uuid(req.assistant_id),
            Assistant.workspace_id == workspace.id,
        )
    )
    assistant = result.scalar_one_or_none()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    if not assistant.voice_enabled:
        raise HTTPException(status_code=400, detail="Voice not enabled for this assistant")

    room_name = f"emefa-{assistant.id.hex[:8]}-{user.id.hex[:8]}"
    participant_identity = f"user-{user.id.hex[:8]}"
    agent_identity = f"agent-{assistant.id.hex[:8]}"

    user_token = generate_livekit_token(
        room_name=room_name,
        participant_name=user.full_name,
        participant_identity=participant_identity,
    )
    agent_token = generate_agent_token(room_name, agent_identity)

    from app.core.config import get_settings
    settings = get_settings()

    return LiveKitTokenResponse(
        token=user_token,
        room_name=room_name,
        livekit_url=settings.LIVEKIT_URL,
        agent_token=agent_token,
    )
