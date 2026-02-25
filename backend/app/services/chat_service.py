"""Chat service - orchestrates conversations with RAG + memory."""

import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decrypt_data, encrypt_data
from app.models.assistant import Assistant
from app.models.conversation import Conversation, ChannelType, Memory, Message, MessageRole
from app.models.knowledge import KnowledgeBase, KBStatus
from app.services.llm_service import get_llm_provider
from app.services.rag_service import search_knowledge


async def chat_with_assistant(
    db: AsyncSession,
    assistant: Assistant,
    user_message: str,
    conversation_id: Optional[str] = None,
    user_id: Optional[uuid.UUID] = None,
    channel: ChannelType = ChannelType.WEB,
    external_chat_id: Optional[str] = None,
) -> dict:
    """Process a user message: RAG lookup + memory + LLM call."""
    # 1. Get or create conversation
    if conversation_id:
        filters = [
            Conversation.id == uuid.UUID(conversation_id),
            Conversation.assistant_id == assistant.id,
        ]
        # For web channel, verify user ownership
        if user_id and channel == ChannelType.WEB:
            filters.append(Conversation.user_id == user_id)
        result = await db.execute(select(Conversation).where(*filters))
        convo = result.scalar_one_or_none()
        if not convo:
            raise ValueError("Conversation not found")
    else:
        convo = Conversation(
            assistant_id=assistant.id,
            user_id=user_id,
            channel=channel,
            external_chat_id=external_chat_id,
        )
        db.add(convo)
        await db.flush()

    # 2. Store user message
    user_msg = Message(
        conversation_id=convo.id,
        role=MessageRole.USER,
        content=user_message,
    )
    db.add(user_msg)
    await db.flush()

    # 3. Retrieve relevant knowledge (RAG)
    sources = []
    rag_context = ""
    kb_result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.assistant_id == assistant.id,
            KnowledgeBase.status == KBStatus.READY,
        )
    )
    knowledge_bases = kb_result.scalars().all()

    for kb in knowledge_bases:
        if kb.collection_name:
            try:
                results = await search_knowledge(
                    kb.collection_name, user_message, top_k=3, provider_name=assistant.llm_provider
                )
                sources.extend(results)
            except Exception:
                pass

    if sources:
        rag_context = "\n\n--- CONTEXTE (base de connaissances) ---\n"
        for i, s in enumerate(sources[:5], 1):
            rag_context += f"[Source {i}: {s['source_name']}] {s['text']}\n"
        rag_context += "--- FIN CONTEXTE ---\n\nUtilise ces sources pour répondre. Cite les sources pertinentes."

    # 4. Retrieve long-term memory
    memory_context = ""
    mem_result = await db.execute(
        select(Memory)
        .where(Memory.assistant_id == assistant.id)
        .order_by(Memory.importance.desc())
        .limit(10)
    )
    memories = mem_result.scalars().all()
    if memories:
        memory_context = "\n\n--- MÉMOIRE ---\n"
        for m in memories:
            try:
                content = decrypt_data(m.content)
            except Exception:
                content = m.content
            memory_context += f"- [{m.category}] {content}\n"
        memory_context += "--- FIN MÉMOIRE ---\n"

    # 5. Build conversation history (short-term memory)
    msg_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == convo.id)
        .order_by(Message.created_at.desc())
        .limit(20)
    )
    history_msgs = list(reversed(msg_result.scalars().all()))

    messages = []
    system_prompt = assistant.system_prompt or f"Tu es {assistant.name}. {assistant.objective}"
    system_prompt += rag_context + memory_context

    messages.append({"role": "system", "content": system_prompt})
    for m in history_msgs:
        messages.append({"role": m.role.value, "content": m.content})

    # 6. Call LLM
    llm = get_llm_provider(assistant.llm_provider)
    result = await llm.chat(messages, model=assistant.llm_model)

    # 7. Store assistant response
    assistant_msg = Message(
        conversation_id=convo.id,
        role=MessageRole.ASSISTANT,
        content=result["content"],
        token_count=result["tokens"],
        sources={"sources": sources[:5]} if sources else None,
    )
    db.add(assistant_msg)

    # 8. Update counters
    convo.message_count += 2
    convo.tokens_used += result["tokens"]
    assistant.total_tokens_used += result["tokens"]

    # 9. Extract and store important facts (simple heuristic)
    await _maybe_store_memory(db, assistant.id, user_message, result["content"])

    await db.flush()

    return {
        "conversation_id": str(convo.id),
        "message": result["content"],
        "sources": sources[:5] if sources else None,
        "tokens_used": result["tokens"],
    }


async def _maybe_store_memory(
    db: AsyncSession, assistant_id: uuid.UUID, user_msg: str, assistant_msg: str
):
    """Simple heuristic to store important facts from conversation."""
    important_patterns = [
        "je m'appelle", "mon nom est", "my name is",
        "je suis", "mon entreprise", "ma société",
        "je préfère", "j'aime", "je n'aime pas",
        "mon email", "mon numéro", "mon adresse",
        "rappelle-toi", "souviens-toi", "remember",
        "note que", "important:",
    ]
    lower_msg = user_msg.lower()
    for pattern in important_patterns:
        if pattern in lower_msg:
            memory = Memory(
                assistant_id=assistant_id,
                category="fact",
                content=encrypt_data(user_msg),
                importance=7,
            )
            db.add(memory)
            break
