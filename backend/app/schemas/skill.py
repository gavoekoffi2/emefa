"""Pydantic Schemas for Skills."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SkillCategoryEnum(str, Enum):
    """Catégories de skills."""
    INTEGRATION = "integration"
    AUTOMATION = "automation"
    ANALYTICS = "analytics"
    COMMUNICATION = "communication"
    PAYMENT = "payment"
    KNOWLEDGE = "knowledge"
    CUSTOM = "custom"


class SkillCreate(BaseModel):
    """Schema pour créer un skill."""
    name: str = Field(..., min_length=3, max_length=255)
    slug: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    category: SkillCategoryEnum
    config_schema: Dict[str, Any] = Field(default_factory=dict)
    prompt_template: Optional[str] = None
    system_message: Optional[str] = None
    tags: Optional[List[str]] = None
    requires_api_key: bool = False


class SkillResponse(BaseModel):
    """Schema pour répondre avec les détails d'un skill."""
    id: str
    name: str
    slug: str
    description: str
    category: str
    version: str
    status: str
    is_official: bool
    installation_count: int = 0
    usage_count: int = 0
    requires_api_key: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SkillInstallResponse(BaseModel):
    """Schema pour une installation de skill."""
    id: str
    skill_id: str
    assistant_id: str
    is_active: bool
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SkillMarketplaceResponse(BaseModel):
    """Schema pour l'entrée du marketplace."""
    id: str
    skill_id: Optional[str]
    title: str
    short_description: str
    is_free: bool
    downloads: int = 0
    rating: int = 0
    is_featured: bool = False
    is_verified: bool = False
    categories: List[str] = []
    
    class Config:
        from_attributes = True


class SkillConfigUpdate(BaseModel):
    """Schema pour mettre à jour la configuration d'un skill."""
    configuration: Dict[str, Any]


class SkillInstallRequest(BaseModel):
    """Schema pour installer un skill."""
    skill_id: str
    assistant_id: str
    configuration: Optional[Dict[str, Any]] = None
