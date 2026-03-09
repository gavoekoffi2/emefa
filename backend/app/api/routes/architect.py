"""Architect project routes - manage architect projects, references, versioning."""

import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_workspace
from app.models.user import User, Workspace
from app.schemas.template import (
    ArchitectProjectCreate,
    ArchitectProjectResponse,
    ArchitectProjectUpdate,
    ProjectVersionResponse,
)
from app.services import architect_service
from app.services.audit_service import log_action

router = APIRouter(prefix="/architect/projects", tags=["architect"])


def _project_response(p) -> ArchitectProjectResponse:
    return ArchitectProjectResponse(
        id=str(p.id),
        assistant_id=str(p.assistant_id),
        name=p.name,
        description=p.description,
        brief=p.brief,
        status=p.status.value if hasattr(p.status, 'value') else p.status,
        checklist_answers=p.checklist_answers,
        references=p.references,
        current_step=p.current_step,
        action_plan=p.action_plan,
        outputs=p.outputs,
        created_at=str(p.created_at) if p.created_at else "",
        updated_at=str(p.updated_at) if p.updated_at else "",
    )


def _version_response(v) -> ProjectVersionResponse:
    return ProjectVersionResponse(
        id=str(v.id),
        project_id=str(v.project_id),
        version_number=v.version_number,
        label=v.label,
        blender_script=v.blender_script,
        parameters=v.parameters,
        outputs=v.outputs,
        created_at=str(v.created_at) if v.created_at else "",
    )


@router.post("", response_model=ArchitectProjectResponse, status_code=201)
async def create_project(
    req: ArchitectProjectCreate,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new architect project."""
    project = await architect_service.create_project(
        db,
        assistant_id=uuid.UUID(req.assistant_id),
        workspace_id=workspace.id,
        user_id=user.id,
        name=req.name,
        description=req.description,
        brief=req.brief,
    )

    await log_action(
        db, workspace.id, "create", "architect_project",
        resource_id=str(project.id), user_id=user.id,
        details={"name": project.name},
    )
    await db.commit()
    return _project_response(project)


@router.get("", response_model=list[ArchitectProjectResponse])
async def list_projects(
    assistant_id: str = None,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List architect projects."""
    aid = uuid.UUID(assistant_id) if assistant_id else None
    projects = await architect_service.list_projects(db, workspace.id, assistant_id=aid)
    return [_project_response(p) for p in projects]


@router.get("/{project_id}", response_model=ArchitectProjectResponse)
async def get_project(
    project_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific project."""
    project = await architect_service.get_project(db, project_id, workspace.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _project_response(project)


@router.patch("/{project_id}", response_model=ArchitectProjectResponse)
async def update_project(
    project_id: str,
    req: ArchitectProjectUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a project."""
    project = await architect_service.get_project(db, project_id, workspace.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = req.model_dump(exclude_unset=True)
    project = await architect_service.update_project(db, project, update_data)

    await log_action(
        db, workspace.id, "update", "architect_project",
        resource_id=project_id, user_id=user.id,
        details={"fields": list(update_data.keys())},
    )
    await db.commit()
    return _project_response(project)


@router.post("/{project_id}/references")
async def add_reference(
    project_id: str,
    name: str = Form(...),
    ref_type: str = Form("image"),  # image, plan, inspiration
    file: UploadFile = File(...),
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a reference file (plan, photo, inspiration) to a project."""
    project = await architect_service.get_project(db, project_id, workspace.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate file type
    allowed_types = ["image/png", "image/jpeg", "image/svg+xml", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non supporté: {file.content_type}. Autorisés: PNG, JPEG, SVG, PDF",
        )

    # Validate size (50MB)
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 50 MB)")

    # Store file reference (in production: upload to S3/MinIO)
    s3_key = f"architect/{workspace.id}/{project_id}/refs/{file.filename}"
    reference = {
        "name": name,
        "type": ref_type,
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(content),
        "s3_key": s3_key,
    }

    project = await architect_service.add_reference(db, project, reference)
    await db.commit()

    return {"status": "ok", "reference": reference}


@router.post("/{project_id}/generate-plan")
async def generate_plan(
    project_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate an action plan for the project based on brief and checklist."""
    project = await architect_service.get_project(db, project_id, workspace.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    plan = architect_service.generate_action_plan(
        project.brief or "",
        project.checklist_answers,
    )

    project.action_plan = plan
    await db.commit()
    return plan


@router.post("/{project_id}/versions", response_model=ProjectVersionResponse, status_code=201)
async def create_version(
    project_id: str,
    label: str = None,
    blender_script: str = None,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new version snapshot of the project."""
    project = await architect_service.get_project(db, project_id, workspace.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    version = await architect_service.create_version(
        db, project,
        label=label,
        blender_script=blender_script,
        parameters=project.checklist_answers,
        outputs=project.outputs,
    )

    await log_action(
        db, workspace.id, "create", "project_version",
        resource_id=str(version.id), user_id=user.id,
        details={"project": project.name, "version": version.version_number},
    )
    await db.commit()
    return _version_response(version)


@router.get("/{project_id}/versions", response_model=list[ProjectVersionResponse])
async def list_versions(
    project_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    """List all versions of a project."""
    project = await architect_service.get_project(db, project_id, workspace.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    versions = await architect_service.list_versions(db, project.id)
    return [_version_response(v) for v in versions]
