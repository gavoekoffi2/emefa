"""EMEFA Skills Service - Gestion complète des skills et intégrations."""

import json
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from app.models.skill import (
    Skill, SkillVersion, SkillInstallation, SkillConfiguration,
    SkillMarketplaceEntry, SkillCategory, SkillStatus
)
from app.models.assistant import Assistant
from app.models.user import User


class SkillsService:
    """Service pour gérer les skills et leur intégration aux assistants."""

    @staticmethod
    async def create_skill(
        db: AsyncSession,
        author_id: str,
        name: str,
        slug: str,
        description: str,
        category: SkillCategory,
        config_schema: Dict[str, Any],
        prompt_template: Optional[str] = None,
        system_message: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_official: bool = False,
        requires_api_key: bool = False,
    ) -> Skill:
        """Créer un nouveau skill."""
        
        skill = Skill(
            id=str(uuid.uuid4()),
            name=name,
            slug=slug,
            description=description,
            category=category,
            config_schema=config_schema,
            prompt_template=prompt_template,
            system_message=system_message,
            tags=tags or [],
            author_id=author_id,
            author_name="",  # Sera rempli avec le nom de l'auteur
            is_official=is_official,
            requires_api_key=requires_api_key,
            status=SkillStatus.DRAFT,
        )
        
        db.add(skill)
        await db.flush()
        
        # Créer la première version
        await SkillsService.create_skill_version(
            db=db,
            skill_id=skill.id,
            version="0.0.1",
            config_schema=config_schema,
            prompt_template=prompt_template,
            system_message=system_message,
            created_by=author_id,
            is_stable=False,
        )
        
        await db.commit()
        return skill

    @staticmethod
    async def create_skill_version(
        db: AsyncSession,
        skill_id: str,
        version: str,
        config_schema: Dict[str, Any],
        prompt_template: Optional[str],
        system_message: Optional[str],
        created_by: str,
        changelog: Optional[str] = None,
        is_stable: bool = False,
    ) -> SkillVersion:
        """Créer une nouvelle version d'un skill."""
        
        skill_version = SkillVersion(
            id=str(uuid.uuid4()),
            skill_id=skill_id,
            version=version,
            config_schema=config_schema,
            prompt_template=prompt_template,
            system_message=system_message,
            changelog=changelog,
            is_stable=is_stable,
            created_by=created_by,
        )
        
        db.add(skill_version)
        
        # Mettre à jour le skill avec la nouvelle version
        skill = await db.get(Skill, skill_id)
        if skill:
            skill.latest_version = version
            if is_stable:
                skill.version = version
        
        await db.commit()
        return skill_version

    @staticmethod
    async def publish_skill(
        db: AsyncSession,
        skill_id: str,
        is_public: bool = True,
    ) -> Skill:
        """Publier un skill (le rendre disponible)."""
        
        skill = await db.get(Skill, skill_id)
        if not skill:
            raise ValueError(f"Skill {skill_id} not found")
        
        skill.status = SkillStatus.PUBLISHED
        skill.is_public = is_public
        skill.published_at = datetime.utcnow()
        
        await db.commit()
        return skill

    @staticmethod
    async def install_skill(
        db: AsyncSession,
        skill_id: str,
        assistant_id: str,
        configuration: Optional[Dict[str, Any]] = None,
    ) -> SkillInstallation:
        """Installer un skill dans un assistant."""
        
        # Vérifier que le skill existe et est publié
        skill = await db.get(Skill, skill_id)
        if not skill or skill.status != SkillStatus.PUBLISHED:
            raise ValueError(f"Skill {skill_id} not found or not published")
        
        # Vérifier que l'assistant existe
        assistant = await db.get(Assistant, assistant_id)
        if not assistant:
            raise ValueError(f"Assistant {assistant_id} not found")
        
        # Vérifier s'il n'y a pas déjà une installation
        existing = await db.execute(
            select(SkillInstallation).where(
                and_(
                    SkillInstallation.skill_id == skill_id,
                    SkillInstallation.assistant_id == assistant_id,
                )
            )
        )
        if existing.scalar():
            raise ValueError(f"Skill {skill_id} already installed in assistant {assistant_id}")
        
        installation = SkillInstallation(
            id=str(uuid.uuid4()),
            skill_id=skill_id,
            assistant_id=assistant_id,
            configuration=configuration or {},
            is_active=True,
        )
        
        db.add(installation)
        
        # Incrémenter le compteur d'installations
        skill.installation_count += 1
        
        await db.commit()
        return installation

    @staticmethod
    async def uninstall_skill(
        db: AsyncSession,
        skill_id: str,
        assistant_id: str,
    ) -> None:
        """Désinstaller un skill d'un assistant."""
        
        installation = await db.execute(
            select(SkillInstallation).where(
                and_(
                    SkillInstallation.skill_id == skill_id,
                    SkillInstallation.assistant_id == assistant_id,
                )
            )
        )
        installation = installation.scalar()
        
        if installation:
            await db.delete(installation)
            
            # Décrémenter le compteur
            skill = await db.get(Skill, skill_id)
            if skill and skill.installation_count > 0:
                skill.installation_count -= 1
            
            await db.commit()

    @staticmethod
    async def get_assistant_skills(
        db: AsyncSession,
        assistant_id: str,
        active_only: bool = True,
    ) -> List[Skill]:
        """Récupérer tous les skills d'un assistant."""
        
        query = select(Skill).join(SkillInstallation).where(
            SkillInstallation.assistant_id == assistant_id
        )
        
        if active_only:
            query = query.where(SkillInstallation.is_active == True)
        
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_skill_marketplace(
        db: AsyncSession,
        category: Optional[SkillCategory] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[List[SkillMarketplaceEntry], int]:
        """Récupérer les skills du marketplace avec filtrage."""
        
        query = select(SkillMarketplaceEntry)
        
        # Filtres
        if category:
            query = query.where(SkillMarketplaceEntry.categories.contains([category.value]))
        
        if search:
            query = query.where(
                or_(
                    SkillMarketplaceEntry.title.ilike(f"%{search}%"),
                    SkillMarketplaceEntry.short_description.ilike(f"%{search}%"),
                )
            )
        
        # Tri et pagination
        query = query.order_by(SkillMarketplaceEntry.downloads.desc())
        
        # Compter le total
        count_result = await db.execute(select(SkillMarketplaceEntry))
        total = len(count_result.scalars().all())
        
        # Appliquer pagination
        query = query.limit(limit).offset(offset)
        
        result = await db.execute(query)
        return result.scalars().all(), total

    @staticmethod
    async def seed_official_skills(db: AsyncSession) -> None:
        """Seeder les skills officiels EMEFA."""
        
        official_skills = [
            {
                "name": "WhatsApp Integration",
                "slug": "whatsapp-integration",
                "description": "Intégrez WhatsApp à votre assistant pour communiquer avec vos clients directement.",
                "category": SkillCategory.INTEGRATION,
                "config_schema": {
                    "type": "object",
                    "properties": {
                        "phone_number": {"type": "string", "description": "Numéro WhatsApp Business"},
                        "access_token": {"type": "string", "description": "Token d'accès WhatsApp"},
                        "webhook_url": {"type": "string", "description": "URL pour les webhooks"},
                    },
                    "required": ["phone_number", "access_token"],
                },
                "prompt_template": "Tu es un assistant WhatsApp. Réponds rapidement et naturellement.",
                "requires_api_key": True,
                "is_official": True,
            },
            {
                "name": "Telegram Integration",
                "slug": "telegram-integration",
                "description": "Connectez Telegram pour automatiser les conversations et les commandes.",
                "category": SkillCategory.INTEGRATION,
                "config_schema": {
                    "type": "object",
                    "properties": {
                        "bot_token": {"type": "string", "description": "Token du bot Telegram"},
                        "webhook_url": {"type": "string", "description": "URL pour les webhooks"},
                    },
                    "required": ["bot_token"],
                },
                "prompt_template": "Tu es un bot Telegram. Sois court et efficace.",
                "requires_api_key": True,
                "is_official": True,
            },
            {
                "name": "Google Sheets Integration",
                "slug": "google-sheets",
                "description": "Lisez et écrivez dans Google Sheets directement depuis votre assistant.",
                "category": SkillCategory.INTEGRATION,
                "config_schema": {
                    "type": "object",
                    "properties": {
                        "spreadsheet_id": {"type": "string", "description": "ID du Google Sheet"},
                        "sheet_name": {"type": "string", "description": "Nom de l'onglet"},
                        "api_key": {"type": "string", "description": "Clé API Google"},
                    },
                    "required": ["spreadsheet_id", "api_key"],
                },
                "requires_api_key": True,
                "is_official": True,
            },
            {
                "name": "SMS Automation",
                "slug": "sms-automation",
                "description": "Envoyez des SMS automatiquement via Twilio ou un service local africain.",
                "category": SkillCategory.COMMUNICATION,
                "config_schema": {
                    "type": "object",
                    "properties": {
                        "provider": {"type": "string", "enum": ["twilio", "wave", "orange-money"]},
                        "api_key": {"type": "string"},
                        "sender_id": {"type": "string"},
                    },
                    "required": ["provider", "api_key"],
                },
                "requires_api_key": True,
                "is_official": True,
            },
            {
                "name": "Payment Processing",
                "slug": "payment-processing",
                "description": "Acceptez les paiements via Flutterwave, M-Pesa, Wave ou Orange Money.",
                "category": SkillCategory.PAYMENT,
                "config_schema": {
                    "type": "object",
                    "properties": {
                        "payment_provider": {
                            "type": "string",
                            "enum": ["flutterwave", "m-pesa", "wave", "orange-money"]
                        },
                        "api_key": {"type": "string"},
                        "business_account": {"type": "string"},
                    },
                    "required": ["payment_provider", "api_key"],
                },
                "requires_api_key": True,
                "is_official": True,
            },
            {
                "name": "Email Automation",
                "slug": "email-automation",
                "description": "Envoyez des emails automatisés à partir de votre assistant.",
                "category": SkillCategory.COMMUNICATION,
                "config_schema": {
                    "type": "object",
                    "properties": {
                        "smtp_host": {"type": "string"},
                        "smtp_port": {"type": "integer"},
                        "email": {"type": "string"},
                        "password": {"type": "string"},
                    },
                    "required": ["smtp_host", "email", "password"],
                },
                "requires_api_key": True,
                "is_official": True,
            },
            {
                "name": "FAQ & Knowledge Base",
                "slug": "faq-knowledge-base",
                "description": "Construisez une base de connaissances FAQ pour vos réponses courantes.",
                "category": SkillCategory.KNOWLEDGE,
                "config_schema": {
                    "type": "object",
                    "properties": {
                        "auto_learning": {"type": "boolean", "description": "Apprentissage automatique de réponses"},
                        "feedback_threshold": {"type": "number", "description": "Seuil de qualité (0-1)"},
                    },
                },
                "is_official": True,
            },
            {
                "name": "Web Scraping & Research",
                "slug": "web-research",
                "description": "Permettez à votre assistant de rechercher sur Internet en temps réel.",
                "category": SkillCategory.AUTOMATION,
                "config_schema": {
                    "type": "object",
                    "properties": {
                        "search_engine": {"type": "string", "enum": ["brave", "google", "duckduckgo"]},
                        "max_results": {"type": "integer", "default": 5},
                    },
                },
                "is_official": True,
            },
            {
                "name": "Content Generation",
                "slug": "content-generation",
                "description": "Générez du contenu pour les réseaux sociaux (Instagram, TikTok, Facebook).",
                "category": SkillCategory.AUTOMATION,
                "config_schema": {
                    "type": "object",
                    "properties": {
                        "platforms": {
                            "type": "array",
                            "items": {"type": "string", "enum": ["instagram", "tiktok", "facebook", "twitter"]},
                        },
                        "style": {"type": "string", "enum": ["professional", "casual", "viral", "educational"]},
                    },
                },
                "is_official": True,
            },
            {
                "name": "Prospection & Lead Generation",
                "slug": "prospection",
                "description": "Automatisez la recherche de leads et l'envoi de messages de prospection.",
                "category": SkillCategory.AUTOMATION,
                "config_schema": {
                    "type": "object",
                    "properties": {
                        "data_source": {"type": "string", "enum": ["linkedin", "facebook", "instagram", "custom_list"]},
                        "message_template": {"type": "string"},
                        "daily_limit": {"type": "integer", "default": 50},
                    },
                },
                "is_official": True,
            },
        ]
        
        for skill_data in official_skills:
            # Vérifier si le skill existe déjà
            existing = await db.execute(
                select(Skill).where(Skill.slug == skill_data["slug"])
            )
            if existing.scalar():
                continue
            
            # Créer le skill
            skill = await SkillsService.create_skill(
                db=db,
                author_id="system",
                name=skill_data["name"],
                slug=skill_data["slug"],
                description=skill_data["description"],
                category=SkillCategory(skill_data["category"]),
                config_schema=skill_data.get("config_schema", {}),
                prompt_template=skill_data.get("prompt_template"),
                system_message=skill_data.get("system_message"),
                is_official=skill_data.get("is_official", False),
                requires_api_key=skill_data.get("requires_api_key", False),
            )
            
            # Publier automatiquement
            await SkillsService.publish_skill(db, skill.id, is_public=True)
            
            # Créer une entrée marketplace
            marketplace_entry = SkillMarketplaceEntry(
                id=str(uuid.uuid4()),
                skill_id=skill.id,
                title=skill_data["name"],
                short_description=skill_data["description"],
                categories=[skill_data["category"]],
                is_free=True,
                is_featured=True,
                is_verified=True,
            )
            db.add(marketplace_entry)
        
        await db.commit()
