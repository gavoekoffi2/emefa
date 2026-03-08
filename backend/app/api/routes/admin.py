"""Admin routes - monitoring, audit, usage stats."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_workspace, require_admin
from app.models.assistant import Assistant
from app.models.audit import AuditLog
from app.models.conversation import Conversation, Message
from app.models.user import Workspace, WorkspaceMember

router = APIRouter(prefix="/admin", tags=["admin"])


class WorkspaceStats(BaseModel):
    total_assistants: int
    total_conversations: int
    total_messages: int
    total_tokens_used: int
    members_count: int


class AuditLogResponse(BaseModel):
    id: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    details: Optional[dict]
    ip_address: Optional[str]
    created_at: str


@router.get("/stats", response_model=WorkspaceStats)
async def get_workspace_stats(
    workspace: Workspace = Depends(get_current_workspace),
    _admin: WorkspaceMember = require_admin(),
    db: AsyncSession = Depends(get_db),
):
    # Gather stats
    assistants_count = (await db.execute(
        select(func.count(Assistant.id)).where(Assistant.workspace_id == workspace.id)
    )).scalar() or 0

    assistant_ids_result = await db.execute(
        select(Assistant.id).where(Assistant.workspace_id == workspace.id)
    )
    assistant_ids = [r[0] for r in assistant_ids_result.all()]

    convos_count = 0
    msgs_count = 0
    tokens_total = 0
    if assistant_ids:
        convos_count = (await db.execute(
            select(func.count(Conversation.id)).where(Conversation.assistant_id.in_(assistant_ids))
        )).scalar() or 0

        tokens_total = (await db.execute(
            select(func.coalesce(func.sum(Assistant.total_tokens_used), 0)).where(
                Assistant.workspace_id == workspace.id
            )
        )).scalar() or 0

        msgs_count = (await db.execute(
            select(func.count(Message.id)).where(
                Message.conversation_id.in_(
                    select(Conversation.id).where(Conversation.assistant_id.in_(assistant_ids))
                )
            )
        )).scalar() or 0

    members_count = (await db.execute(
        select(func.count(WorkspaceMember.id)).where(
            WorkspaceMember.workspace_id == workspace.id
        )
    )).scalar() or 0

    return WorkspaceStats(
        total_assistants=assistants_count,
        total_conversations=convos_count,
        total_messages=msgs_count,
        total_tokens_used=tokens_total,
        members_count=members_count,
    )


@router.get("/audit", response_model=list[AuditLogResponse])
async def get_audit_logs(
    workspace: Workspace = Depends(get_current_workspace),
    _admin: WorkspaceMember = require_admin(),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
):
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.workspace_id == workspace.id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    logs = result.scalars().all()
    return [AuditLogResponse(
        id=str(log.id),
        action=log.action,
        resource_type=log.resource_type,
        resource_id=log.resource_id,
        details=log.details,
        ip_address=log.ip_address,
        created_at=str(log.created_at),
    ) for log in logs]
