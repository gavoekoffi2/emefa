"""Actions routes - list available actions, execute with permissions."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_workspace
from app.models.assistant import Assistant
from app.models.user import User, Workspace
from app.services.actions_service import (
    execute_action,
    get_available_actions,
    validate_action,
)

router = APIRouter(prefix="/actions", tags=["actions"])


def _parse_uuid(value: str, name: str = "ID") -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=400, detail=f"Invalid {name} format")


class ActionExecuteRequest(BaseModel):
    assistant_id: str
    action_name: str
    params: dict = {}


class ActionResponse(BaseModel):
    name: str
    description: str
    category: str
    permissions: list[str]
    rate_limit: int


@router.get("", response_model=list[ActionResponse])
async def list_actions():
    """List all available actions."""
    actions = get_available_actions()
    return [ActionResponse(**a) for a in actions]


@router.post("/execute")
async def run_action(
    req: ActionExecuteRequest,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Execute an action with permission check and audit logging."""
    result = await db.execute(
        select(Assistant).where(
            Assistant.id == _parse_uuid(req.assistant_id),
            Assistant.workspace_id == workspace.id,
        )
    )
    assistant = result.scalar_one_or_none()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    if not validate_action(req.action_name, assistant.enabled_actions or {}):
        raise HTTPException(
            status_code=403,
            detail=f"Action '{req.action_name}' not enabled for this assistant"
        )

    try:
        result = await execute_action(
            action_name=req.action_name,
            params=req.params,
            db=db,
            workspace_id=workspace.id,
            user_id=user.id,
        )
        await db.commit()
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
