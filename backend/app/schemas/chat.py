"""Chat schemas."""

from typing import Optional

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    sources: Optional[list[dict]] = None
    tokens_used: int = 0


class ConversationResponse(BaseModel):
    id: str
    assistant_id: str
    channel: str
    title: Optional[str] = None
    message_count: int
    is_active: bool
    created_at: str

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    sources: Optional[dict] = None
    tool_name: Optional[str] = None
    created_at: str

    model_config = {"from_attributes": True}
