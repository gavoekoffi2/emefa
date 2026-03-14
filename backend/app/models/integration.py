"""EMEFA Integration Model - Stockage des connexions utilisateur (WhatsApp, Telegram, etc)."""

from sqlalchemy import Column, String, Text, DateTime, Boolean, JSON, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.models.base import Base


class IntegrationProvider(str, enum.Enum):
    WHATSAPP = "whatsapp"
    TELEGRAM = "telegram"
    GOOGLE_SHEETS = "google_sheets"
    SMS = "sms"
    EMAIL = "email"
    PAYMENT = "payment"


class IntegrationStatus(str, enum.Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    PENDING = "pending"
    ERROR = "error"


class UserIntegration(Base):
    """Stocke les connexions d'un utilisateur avec les services externes."""
    __tablename__ = "user_integrations"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # Provider info
    provider = Column(Enum(IntegrationProvider), nullable=False, index=True)
    status = Column(Enum(IntegrationStatus), default=IntegrationStatus.DISCONNECTED, index=True)
    
    # Credentials (encrypted)
    credentials = Column(JSON, default=dict)  # Encrypted credentials storage
    
    # Provider-specific metadata
    phone_number = Column(String(20), nullable=True)        # WhatsApp
    bot_token = Column(Text, nullable=True)                  # Telegram
    bot_username = Column(String(255), nullable=True)        # Telegram
    session_data = Column(Text, nullable=True)               # WhatsApp Web session
    oauth_token = Column(Text, nullable=True)                # Google Sheets
    oauth_refresh_token = Column(Text, nullable=True)        # Google Sheets
    api_key = Column(Text, nullable=True)                    # SMS/Payment providers
    provider_name = Column(String(100), nullable=True)       # Sub-provider (paystack, wave, etc)
    
    # Metadata
    webhook_url = Column(String(500), nullable=True)
    webhook_secret = Column(String(255), nullable=True)
    
    # Stats
    messages_sent = Column(String(20), default="0")
    messages_received = Column(String(20), default="0")
    last_activity_at = Column(DateTime, nullable=True)
    
    # Timestamps
    connected_at = Column(DateTime, nullable=True)
    disconnected_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<UserIntegration {self.provider} ({self.status}) for user {self.user_id}>"


class PlatformApiKey(Base):
    """Clés API globales de la plateforme (gérées par l'admin)."""
    __tablename__ = "platform_api_keys"

    id = Column(String(36), primary_key=True, index=True)
    
    name = Column(String(255), nullable=False)
    provider = Column(String(100), nullable=False, index=True)
    
    # Key (encrypted)
    api_key = Column(Text, nullable=False)
    
    # Metadata
    is_active = Column(Boolean, default=True, index=True)
    usage_count = Column(String(20), default="0")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)

    def __repr__(self):
        return f"<PlatformApiKey {self.name} ({self.provider})>"
