"""Template routes - list templates, create assistants from templates."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_workspace
from app.models.user import User, Workspace
from app.schemas.template import TemplateCreateAssistant, TemplateResponse
from app.services.audit_service import log_action
from app.services.template_service import (
    create_assistant_from_template,
    export_template_json,
    get_template,
    get_templates,
)

router = APIRouter(prefix="/templates", tags=["templates"])


def _to_response(t) -> TemplateResponse:
    return TemplateResponse(
        id=str(t.id),
        name=t.name,
        category=t.category.value if hasattr(t.category, 'value') else t.category,
        description=t.description,
        icon=t.icon,
        default_objective=t.default_objective,
        default_tone=t.default_tone,
        default_language=t.default_language,
        default_custom_rules=t.default_custom_rules,
        checklist_questions=t.checklist_questions,
        required_bridge=t.required_bridge,
        metadata_json=t.metadata_json,
        is_active=t.is_active,
    )


@router.get("", response_model=list[TemplateResponse])
async def list_templates(
    category: str = None,
    db: AsyncSession = Depends(get_db),
):
    """List all available assistant templates."""
    templates = await get_templates(db, category=category)
    return [_to_response(t) for t in templates]


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template_detail(
    template_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific template by ID."""
    template = await get_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return _to_response(template)


@router.get("/{template_id}/export")
async def export_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Export a template as JSON."""
    template = await get_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return export_template_json(template)


@router.post("/{template_id}/create-assistant", status_code=201)
async def create_from_template(
    template_id: str,
    req: TemplateCreateAssistant,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new assistant from a template."""
    template = await get_template(db, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    assistant = await create_assistant_from_template(
        db,
        template=template,
        workspace_id=workspace.id,
        name=req.name,
        language=req.language,
        custom_rules=req.custom_rules,
    )

    await log_action(
        db, workspace.id, "create", "assistant",
        resource_id=str(assistant.id), user_id=user.id,
        details={"name": assistant.name, "template": template.name},
    )
    await db.commit()

    return {
        "id": str(assistant.id),
        "name": assistant.name,
        "template_id": str(template.id),
        "template_name": template.name,
    }
