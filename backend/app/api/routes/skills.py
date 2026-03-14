"""EMEFA Skills API Routes - Gestion des skills et intégrations."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.skill import SkillCategory
from app.services.skills_service import SkillsService
from app.schemas.skill import (
    SkillCreate, SkillResponse, SkillInstallResponse,
    SkillMarketplaceResponse,
)

router = APIRouter(prefix="/skills", tags=["Skills"])


@router.post("", response_model=SkillResponse, status_code=201)
async def create_skill(
    skill_data: SkillCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Créer un nouveau skill personnel."""
    
    try:
        skill = await SkillsService.create_skill(
            db=db,
            author_id=current_user.id,
            name=skill_data.name,
            slug=skill_data.slug,
            description=skill_data.description,
            category=skill_data.category,
            config_schema=skill_data.config_schema,
            prompt_template=skill_data.prompt_template,
            system_message=skill_data.system_message,
            tags=skill_data.tags,
            requires_api_key=skill_data.requires_api_key,
        )
        return SkillResponse.from_orm(skill)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{skill_id}/publish")
async def publish_skill(
    skill_id: str,
    is_public: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Publier un skill (le rendre disponible sur le marketplace)."""
    
    try:
        skill = await SkillsService.publish_skill(
            db=db,
            skill_id=skill_id,
            is_public=is_public,
        )
        return {
            "message": "Skill published successfully",
            "skill": SkillResponse.from_orm(skill),
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{skill_id}/install/{assistant_id}", response_model=SkillInstallResponse)
async def install_skill(
    skill_id: str,
    assistant_id: str,
    configuration: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Installer un skill dans un assistant."""
    
    try:
        installation = await SkillsService.install_skill(
            db=db,
            skill_id=skill_id,
            assistant_id=assistant_id,
            configuration=configuration or {},
        )
        return SkillInstallResponse.from_orm(installation)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{skill_id}/uninstall/{assistant_id}")
async def uninstall_skill(
    skill_id: str,
    assistant_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Désinstaller un skill d'un assistant."""
    
    try:
        await SkillsService.uninstall_skill(
            db=db,
            skill_id=skill_id,
            assistant_id=assistant_id,
        )
        return {"message": "Skill uninstalled successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/marketplace", response_model=dict)
async def get_marketplace(
    category: Optional[SkillCategory] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Récupérer les skills du marketplace."""
    
    try:
        skills, total = await SkillsService.get_skill_marketplace(
            db=db,
            category=category,
            search=search,
            limit=limit,
            offset=offset,
        )
        
        return {
            "items": [SkillMarketplaceResponse.from_orm(s) for s in skills],
            "total": total,
            "limit": limit,
            "offset": offset,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/assistant/{assistant_id}", response_model=List[SkillResponse])
async def get_assistant_skills(
    assistant_id: str,
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Récupérer tous les skills d'un assistant."""
    
    try:
        skills = await SkillsService.get_assistant_skills(
            db=db,
            assistant_id=assistant_id,
            active_only=active_only,
        )
        return [SkillResponse.from_orm(s) for s in skills]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
