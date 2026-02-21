"""Assistant schemas."""

from typing import Optional

from pydantic import BaseModel


class AssistantCreate(BaseModel):
    name: str
    objective: str
    tone: str = "professional"
    language: str = "fr"
    custom_rules: Optional[str] = None
    web_chat_enabled: bool = True
    voice_enabled: bool = False
    telegram_enabled: bool = False
    whatsapp_enabled: bool = False


class AssistantUpdate(BaseModel):
    name: Optional[str] = None
    objective: Optional[str] = None
    tone: Optional[str] = None
    language: Optional[str] = None
    custom_rules: Optional[str] = None
    system_prompt: Optional[str] = None
    status: Optional[str] = None
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
