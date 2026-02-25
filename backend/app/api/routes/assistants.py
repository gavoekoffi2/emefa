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
from app.services.prompt_generator import build_fallback_prompt, generate_system_prompt

router = APIRouter(prefix="/assistants", tags=["assistants"])


@router.get("", response_model=list[AssistantResponse])
async def list_assistants(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Assistant).where(Assistant.workspace_id == workspace.id).order_by(Assistant.created_at.desc())
    )
    assistants = result.scalars().all()
    return [AssistantResponse(id=str(a.id), **{
        k: getattr(a, k) for k in AssistantResponse.model_fields if k != "id" and hasattr(a, k)
    }) for a in assistants]


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
    await db.commit()

    return AssistantResponse(
        id=str(assistant.id),
        name=assistant.name,
        description=assistant.description,
        objective=assistant.objective,
        tone=assistant.tone,
        language=assistant.language,
        custom_rules=assistant.custom_rules,
        system_prompt=assistant.system_prompt,
        status=assistant.status.value,
        web_chat_enabled=assistant.web_chat_enabled,
        voice_enabled=assistant.voice_enabled,
        telegram_enabled=assistant.telegram_enabled,
        whatsapp_enabled=assistant.whatsapp_enabled,
        whatsapp_qr_enabled=assistant.whatsapp_qr_enabled,
        llm_provider=assistant.llm_provider,
        llm_model=assistant.llm_model,
        enabled_actions=assistant.enabled_actions,
        total_tokens_used=assistant.total_tokens_used,
    )


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

    return AssistantResponse(
        id=str(assistant.id),
        name=assistant.name,
        description=assistant.description,
        objective=assistant.objective,
        tone=assistant.tone,
        language=assistant.language,
        custom_rules=assistant.custom_rules,
        system_prompt=assistant.system_prompt,
        status=assistant.status.value,
        web_chat_enabled=assistant.web_chat_enabled,
        voice_enabled=assistant.voice_enabled,
        telegram_enabled=assistant.telegram_enabled,
        whatsapp_enabled=assistant.whatsapp_enabled,
        whatsapp_qr_enabled=assistant.whatsapp_qr_enabled,
        llm_provider=assistant.llm_provider,
        llm_model=assistant.llm_model,
        enabled_actions=assistant.enabled_actions,
        total_tokens_used=assistant.total_tokens_used,
    )


@router.patch("/{assistant_id}", response_model=AssistantResponse)
async def update_assistant(
    assistant_id: str,
    req: AssistantUpdate,
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

    await db.commit()

    return AssistantResponse(
        id=str(assistant.id),
        name=assistant.name,
        description=assistant.description,
        objective=assistant.objective,
        tone=assistant.tone,
        language=assistant.language,
        custom_rules=assistant.custom_rules,
        system_prompt=assistant.system_prompt,
        status=assistant.status.value if isinstance(assistant.status, AssistantStatus) else assistant.status,
        web_chat_enabled=assistant.web_chat_enabled,
        voice_enabled=assistant.voice_enabled,
        telegram_enabled=assistant.telegram_enabled,
        whatsapp_enabled=assistant.whatsapp_enabled,
        whatsapp_qr_enabled=assistant.whatsapp_qr_enabled,
        llm_provider=assistant.llm_provider,
        llm_model=assistant.llm_model,
        enabled_actions=assistant.enabled_actions,
        total_tokens_used=assistant.total_tokens_used,
    )


@router.delete("/{assistant_id}", status_code=204)
async def delete_assistant(
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

    await db.delete(assistant)
    await db.commit()
