"""Chat routes - web chat with assistant."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_workspace
from app.models.assistant import Assistant
from app.models.conversation import Conversation, Message
from app.models.user import User, Workspace
from app.schemas.chat import ChatRequest, ChatResponse, ConversationResponse, MessageResponse
from app.services.chat_service import chat_with_assistant

router = APIRouter(prefix="/assistants/{assistant_id}/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    assistant_id: str,
    req: ChatRequest,
    workspace: Workspace = Depends(get_current_workspace),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Assistant).where(
            Assistant.id == uuid.UUID(assistant_id),
            Assistant.workspace_id == workspace.id,
        )
    )
    assistant = result.scalar_one_or_none()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")

    try:
        response = await chat_with_assistant(
            db=db,
            assistant=assistant,
            user_message=req.message,
            conversation_id=req.conversation_id,
            user_id=user.id,
        )
        await db.commit()
        return ChatResponse(**response)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    assistant_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.assistant_id == uuid.UUID(assistant_id))
        .order_by(Conversation.updated_at.desc())
        .limit(50)
    )
    convos = result.scalars().all()
    return [ConversationResponse(
        id=str(c.id), assistant_id=str(c.assistant_id),
        channel=c.channel.value, title=c.title,
        message_count=c.message_count, is_active=c.is_active,
    ) for c in convos]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    assistant_id: str,
    conversation_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == uuid.UUID(conversation_id))
        .order_by(Message.created_at.asc())
        .limit(100)
    )
    msgs = result.scalars().all()
    return [MessageResponse(
        id=str(m.id), role=m.role.value, content=m.content,
        sources=m.sources, tool_name=m.tool_name,
        created_at=str(m.created_at),
    ) for m in msgs]
