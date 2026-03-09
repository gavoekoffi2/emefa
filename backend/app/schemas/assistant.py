"""Assistant schemas."""

from typing import Optional

from pydantic import BaseModel, Field


class AssistantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    objective: str = Field(..., min_length=1, max_length=2000)
    tone: str = Field("professional", max_length=50)
    language: str = Field("fr", max_length=10)
    custom_rules: Optional[str] = Field(None, max_length=5000)
    web_chat_enabled: bool = True
    voice_enabled: bool = False
    telegram_enabled: bool = False
    whatsapp_enabled: bool = False


class AssistantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    objective: Optional[str] = Field(None, min_length=1, max_length=2000)
    tone: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, max_length=10)
    custom_rules: Optional[str] = Field(None, max_length=5000)
    system_prompt: Optional[str] = Field(None, max_length=10_000)
    status: Optional[str] = Field(None, max_length=20)
    web_chat_enabled: Optional[bool] = None
    voice_enabled: Optional[bool] = None
    telegram_enabled: Optional[bool] = None
    telegram_bot_token: Optional[str] = None
    whatsapp_enabled: Optional[bool] = None
    whatsapp_phone_id: Optional[str] = None
    whatsapp_qr_enabled: Optional[bool] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    enabled_actions: Optional[dict] = None


class AssistantResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    objective: str
    tone: str
    language: str
    custom_rules: Optional[str] = None
    system_prompt: Optional[str] = None
    status: str
    web_chat_enabled: bool
    voice_enabled: bool
    telegram_enabled: bool
    whatsapp_enabled: bool
    whatsapp_qr_enabled: bool
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    enabled_actions: Optional[dict] = None
    total_tokens_used: int

    model_config = {"from_attributes": True}
