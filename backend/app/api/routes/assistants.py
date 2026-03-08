"""Assistant CRUD routes."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_workspace
from app.models.assistant import Assistant, AssistantStatus
from app.models.user import User, Workspace
from app.schemas.assistant import AssistantCreate, AssistantResponse, AssistantUpdate
from app.services.audit_service import log_action
from app.services.prompt_generator import build_fallback_prompt, generate_system_prompt

router = APIRouter(prefix="/assistants", tags=["assistants"])


def _to_response(a: Assistant) -> AssistantResponse:
    """Convert an Assistant model to an AssistantResponse."""
    return AssistantResponse(
        id=str(a.id),
        name=a.name,
        description=a.description,
        objective=a.objective,
        tone=a.tone,
        language=a.language,
        custom_rules=a.custom_rules,
        system_prompt=a.system_prompt,
        status=a.status.value if isinstance(a.status, AssistantStatus) else a.status,
        web_chat_enabled=a.web_chat_enabled,
        voice_enabled=a.voice_enabled,
        telegram_enabled=a.telegram_enabled,
        whatsapp_enabled=a.whatsapp_enabled,
        whatsapp_qr_enabled=a.whatsapp_qr_enabled,
        llm_provider=a.llm_provider,
        llm_model=a.llm_model,
        enabled_actions=a.enabled_actions,
        total_tokens_used=a.total_tokens_used,
    )


@router.get("", response_model=list[AssistantResponse])
async def list_assistants(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Assistant).where(Assistant.workspace_id == workspace.id).order_by(Assistant.created_at.desc())
    )
    assistants = result.scalars().all()
    return [_to_response(a) for a in assistants]


@router.post("", response_model=AssistantResponse, status_code=201)
async def create_assistant(
    req: AssistantCreate,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Generate system prompt
    try:
        system_prompt = await generate_system_prompt(
            req.objective, req.tone, req.language, req.custom_rules
        )
    except Exception:
        system_prompt = build_fallback_prompt(
            req.objective, req.tone, req.language, req.custom_rules
        )

    assistant = Assistant(
        workspace_id=workspace.id,
        name=req.name,
        objective=req.objective,
        tone=req.tone,
        language=req.language,
        custom_rules=req.custom_rules,
        system_prompt=system_prompt,
        web_chat_enabled=req.web_chat_enabled,
        voice_enabled=req.voice_enabled,
        telegram_enabled=req.telegram_enabled,
        whatsapp_enabled=req.whatsapp_enabled,
        status=AssistantStatus.ACTIVE,
    )
    db.add(assistant)
    await db.flush()

    await log_action(
        db, workspace.id, "create", "assistant",
        resource_id=str(assistant.id), user_id=user.id,
        details={"name": assistant.name},
    )
    await db.commit()

    return _to_response(assistant)


@router.get("/{assistant_id}", response_model=AssistantResponse)
async def get_assistant(
    assistant_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Assistant).where(
            Assistant.id == uuid.UUID(assistant_id),
            Assistant.workspace_id == workspace.id,
        )
    )
    assistant = result.scalar_one_or_none()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    return _to_response(assistant)


@router.patch("/{assistant_id}", response_model=AssistantResponse)
async def update_assistant(
    assistant_id: str,
    req: AssistantUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Assistant).where(
            Assistant.id == uuid.UUID(assistant_id),
            Assistant.workspace_id == workspace.id,
        )
    )
    assistant = result.scalar_one_or_none()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    update_data = req.model_dump(exclude_unset=True)

    # Re-generate system prompt if objective changed
    if "objective" in update_data:
        try:
            update_data["system_prompt"] = await generate_system_prompt(
                update_data.get("objective", assistant.objective),
                update_data.get("tone", assistant.tone),
                update_data.get("language", assistant.language),
                update_data.get("custom_rules", assistant.custom_rules),
            )
        except Exception:
            update_data["system_prompt"] = build_fallback_prompt(
                update_data.get("objective", assistant.objective),
                update_data.get("tone", assistant.tone),
                update_data.get("language", assistant.language),
                update_data.get("custom_rules", assistant.custom_rules),
            )

    for key, value in update_data.items():
        if hasattr(assistant, key):
            setattr(assistant, key, value)

    await log_action(
        db, workspace.id, "update", "assistant",
        resource_id=str(assistant.id), user_id=user.id,
        details={"fields": list(update_data.keys())},
    )
    await db.commit()

    return _to_response(assistant)


@router.delete("/{assistant_id}", status_code=204)
async def delete_assistant(
    assistant_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Assistant).where(
            Assistant.id == uuid.UUID(assistant_id),
            Assistant.workspace_id == workspace.id,
        )
    )
    assistant = result.scalar_one_or_none()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    assistant_name = assistant.name
    await db.delete(assistant)
    await log_action(
        db, workspace.id, "delete", "assistant",
        resource_id=assistant_id, user_id=user.id,
        details={"name": assistant_name},
    )
    await db.commit()
