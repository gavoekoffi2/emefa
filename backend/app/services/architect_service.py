"""Architect project service - manages architect projects, versioning, and action plans."""

import uuid
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.template import (
    ArchitectProject,
    ProjectVersion,
    ProjectVersionStatus,
)


async def create_project(
    db: AsyncSession,
    assistant_id: uuid.UUID,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    name: str,
    description: Optional[str] = None,
    brief: Optional[str] = None,
) -> ArchitectProject:
    """Create a new architect project."""
    project = ArchitectProject(
        assistant_id=assistant_id,
        workspace_id=workspace_id,
        user_id=user_id,
        name=name,
        description=description,
        brief=brief,
    )
    db.add(project)
    await db.flush()
    return project


async def get_project(
    db: AsyncSession, project_id: str, workspace_id: uuid.UUID
) -> Optional[ArchitectProject]:
    """Get a project by ID."""
    result = await db.execute(
        select(ArchitectProject).where(
            ArchitectProject.id == uuid.UUID(project_id),
            ArchitectProject.workspace_id == workspace_id,
        )
    )
    return result.scalar_one_or_none()


async def list_projects(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    assistant_id: Optional[uuid.UUID] = None,
    limit: int = 50,
) -> list[ArchitectProject]:
    """List projects for a workspace."""
    query = select(ArchitectProject).where(
        ArchitectProject.workspace_id == workspace_id
    )
    if assistant_id:
        query = query.where(ArchitectProject.assistant_id == assistant_id)
    result = await db.execute(query.order_by(ArchitectProject.created_at.desc()).limit(limit))
    return list(result.scalars().all())


async def update_project(
    db: AsyncSession, project: ArchitectProject, update_data: dict
) -> ArchitectProject:
    """Update a project's fields."""
    for key, value in update_data.items():
        if hasattr(project, key) and value is not None:
            setattr(project, key, value)
    await db.flush()
    return project


async def add_reference(
    db: AsyncSession, project: ArchitectProject, reference: dict
) -> ArchitectProject:
    """Add a reference (plan, photo, etc.) to a project."""
    refs = project.references or []
    refs.append(reference)
    project.references = refs
    await db.flush()
    return project


async def create_version(
    db: AsyncSession,
    project: ArchitectProject,
    label: Optional[str] = None,
    blender_script: Optional[str] = None,
    parameters: Optional[dict] = None,
    outputs: Optional[list] = None,
) -> ProjectVersion:
    """Create a new version snapshot of the project."""
    # Get next version number
    result = await db.execute(
        select(func.max(ProjectVersion.version_number)).where(
            ProjectVersion.project_id == project.id
        )
    )
    max_version = result.scalar() or 0

    version = ProjectVersion(
        project_id=project.id,
        version_number=max_version + 1,
        label=label or f"v{max_version + 1}",
        blender_script=blender_script,
        parameters=parameters,
        outputs=outputs or [],
    )
    db.add(version)
    await db.flush()
    return version


async def list_versions(
    db: AsyncSession, project_id: uuid.UUID
) -> list[ProjectVersion]:
    """List all versions of a project."""
    result = await db.execute(
        select(ProjectVersion)
        .where(ProjectVersion.project_id == project_id)
        .order_by(ProjectVersion.version_number.desc())
    )
    return list(result.scalars().all())


async def add_output(
    db: AsyncSession, project: ArchitectProject, output: dict
) -> ArchitectProject:
    """Add an output file to the project."""
    outputs = project.outputs or []
    outputs.append(output)
    project.outputs = outputs
    await db.flush()
    return project


def generate_action_plan(brief: str, checklist_answers: Optional[dict] = None) -> dict:
    """Generate a step-by-step action plan from the brief and checklist answers.

    This is a deterministic fallback. The LLM-based version is handled in chat.
    """
    steps = [
        {
            "step": 1,
            "title": "Configuration de la scène",
            "description": "Créer une nouvelle scène Blender avec les bonnes unités (mètres) et configurer le cadre de travail.",
            "actions": ["create_object"],
            "status": "pending",
        },
        {
            "step": 2,
            "title": "Import des références",
            "description": "Importer les plans et photos d'inspiration comme images de référence dans la scène.",
            "actions": ["import_reference"],
            "status": "pending",
        },
        {
            "step": 3,
            "title": "Modélisation des volumes principaux",
            "description": "Créer les volumes de base du bâtiment (murs, toiture, planchers).",
            "actions": ["create_object", "set_dimensions"],
            "status": "pending",
        },
        {
            "step": 4,
            "title": "Application des matériaux",
            "description": "Appliquer les matériaux principaux sur les surfaces.",
            "actions": ["apply_material"],
            "status": "pending",
        },
        {
            "step": 5,
            "title": "Éclairage et caméra",
            "description": "Configurer l'éclairage naturel et positionner la caméra pour les rendus.",
            "actions": ["setup_lighting", "setup_camera"],
            "status": "pending",
        },
        {
            "step": 6,
            "title": "Rendu et export",
            "description": "Lancer les rendus finaux et exporter les fichiers (.blend, .glb, rendu PNG).",
            "actions": ["render", "export"],
            "status": "pending",
        },
    ]

    return {
        "brief_summary": brief[:200] if brief else "Pas de brief fourni",
        "checklist": checklist_answers or {},
        "steps": steps,
        "total_steps": len(steps),
    }
