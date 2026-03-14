"""EMEFA Skills Model - Gestion des compétences réutilisables."""

from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.models.base import Base


class SkillCategory(str, enum.Enum):
    """Catégories de skills."""
    INTEGRATION = "integration"           # WhatsApp, Telegram, Google Sheets, etc.
    AUTOMATION = "automation"             # Automatisation de processus
    ANALYTICS = "analytics"               # Analyse de données
    COMMUNICATION = "communication"       # Gestion des communications
    PAYMENT = "payment"                   # Paiements & transactions
    KNOWLEDGE = "knowledge"               # Gestion des connaissances
    CUSTOM = "custom"                     # Skills personnalisés


class SkillStatus(str, enum.Enum):
    """État d'un skill."""
    DRAFT = "draft"
    PUBLISHED = "published"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


class Skill(Base):
    """Modèle pour les skills/compétences réutilisables."""
    __tablename__ = "skills"

    # Identité
    id = Column(String(36), primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=False)
    documentation = Column(Text, nullable=True)
    
    # Catégorisation
    category = Column(Enum(SkillCategory), nullable=False, index=True)
    tags = Column(JSON, default=list)  # Liste de tags pour le filtering
    
    # Statut & versioning
    status = Column(Enum(SkillStatus), default=SkillStatus.DRAFT, index=True)
    version = Column(String(20), default="0.0.1")
    latest_version = Column(String(20), default="0.0.1")
    
    # Contenu
    config_schema = Column(JSON, default=dict)  # JSON Schema pour validation
    prompt_template = Column(Text, nullable=True)  # Template de prompt pour le skill
    system_message = Column(Text, nullable=True)  # Message système enrichi
    
    # Métadonnées
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    author_name = Column(String(255), nullable=False)
    organization_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    # Stats d'utilisation
    usage_count = Column(Integer, default=0, index=True)
    installation_count = Column(Integer, default=0)
    rating = Column(Integer, default=0)  # 0-5 stars
    
    # Flags
    is_public = Column(Boolean, default=False, index=True)
    is_official = Column(Boolean, default=False)  # Skill officiel EMEFA
    requires_api_key = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)
    
    # Relations
    installations = relationship("SkillInstallation", back_populates="skill", cascade="all, delete-orphan")
    configurations = relationship("SkillConfiguration", back_populates="skill", cascade="all, delete-orphan")
    versions = relationship("SkillVersion", back_populates="skill", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Skill {self.name} v{self.version} ({self.category})>"


class SkillVersion(Base):
    """Historique de versions d'un skill."""
    __tablename__ = "skill_versions"
    
    id = Column(String(36), primary_key=True, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id"), nullable=False, index=True)
    version = Column(String(20), nullable=False)
    
    # Contenu de cette version
    config_schema = Column(JSON, default=dict)
    prompt_template = Column(Text, nullable=True)
    system_message = Column(Text, nullable=True)
    
    # Métadonnées de version
    changelog = Column(Text, nullable=True)
    is_stable = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relation
    skill = relationship("Skill", back_populates="versions")
    
    def __repr__(self):
        return f"<SkillVersion {self.skill_id} v{self.version}>"


class SkillInstallation(Base):
    """Installation d'un skill dans un assistant."""
    __tablename__ = "skill_installations"
    
    id = Column(String(36), primary_key=True, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id"), nullable=False, index=True)
    assistant_id = Column(String(36), ForeignKey("assistants.id"), nullable=False, index=True)
    
    # Configuration de cette installation
    configuration = Column(JSON, default=dict)  # Config spécifique à cet assistant
    is_active = Column(Boolean, default=True, index=True)
    
    # Tracking
    usage_count = Column(Integer, default=0)
    last_used_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relations
    skill = relationship("Skill", back_populates="installations")
    
    def __repr__(self):
        return f"<SkillInstallation {self.skill_id} -> {self.assistant_id}>"


class SkillConfiguration(Base):
    """Configuration sauvegardée pour un skill (réutilisable)."""
    __tablename__ = "skill_configurations"
    
    id = Column(String(36), primary_key=True, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Configuration sauvegardée
    config = Column(JSON, nullable=False)
    
    # Flags
    is_default = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relation
    skill = relationship("Skill", back_populates="configurations")
    
    def __repr__(self):
        return f"<SkillConfiguration {self.name} for {self.skill_id}>"


class SkillMarketplaceEntry(Base):
    """Entrée du marketplace de skills."""
    __tablename__ = "skill_marketplace_entries"
    
    id = Column(String(36), primary_key=True, index=True)
    skill_id = Column(String(36), ForeignKey("skills.id"), nullable=True)  # Peut être None pour les skills system
    
    # Métadonnées marketplace
    title = Column(String(255), nullable=False, index=True)
    short_description = Column(String(500), nullable=False)
    long_description = Column(Text, nullable=True)
    
    # Visual
    icon_url = Column(String(500), nullable=True)
    banner_url = Column(String(500), nullable=True)
    preview_image_urls = Column(JSON, default=list)
    
    # Catégorisation avancée
    categories = Column(JSON, default=list)
    industries = Column(JSON, default=list)  # secteurs (retail, finance, health, etc.)
    use_cases = Column(JSON, default=list)
    
    # Pricing & Trial
    is_free = Column(Boolean, default=True)
    pricing_type = Column(String(50), default="free")  # free, freemium, paid, subscription
    trial_available = Column(Boolean, default=False)
    trial_days = Column(Integer, default=0)
    
    # Stats
    downloads = Column(Integer, default=0)
    rating = Column(Integer, default=0)
    reviews_count = Column(Integer, default=0)
    
    # Flags
    is_featured = Column(Boolean, default=False, index=True)
    is_verified = Column(Boolean, default=False, index=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<SkillMarketplaceEntry {self.title}>"
