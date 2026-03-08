"""Knowledge Base routes - upload, crawl, paste text."""

import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_workspace
from app.models.assistant import Assistant
from app.models.knowledge import KBSourceType, KBStatus, KnowledgeBase
from app.models.user import Workspace
from app.schemas.knowledge import KBCreateText, KBCreateURL, KBResponse
from app.services.rag_service import crawl_url, delete_points_by_source, extract_text_from_file, ingest_text

router = APIRouter(prefix="/assistants/{assistant_id}/knowledge", tags=["knowledge"])


async def _get_assistant(assistant_id: str, workspace: Workspace, db: AsyncSession) -> Assistant:
    result = await db.execute(
        select(Assistant).where(
            Assistant.id == uuid.UUID(assistant_id),
            Assistant.workspace_id == workspace.id,
        )
    )
    assistant = result.scalar_one_or_none()
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    return assistant


@router.get("", response_model=list[KBResponse])
async def list_knowledge_bases(
    assistant_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    assistant = await _get_assistant(assistant_id, workspace, db)
    result = await db.execute(
        select(KnowledgeBase).where(KnowledgeBase.assistant_id == assistant.id)
    )
    kbs = result.scalars().all()
    return [KBResponse(
        id=str(kb.id), assistant_id=str(kb.assistant_id),
        name=kb.name, source_type=kb.source_type.value,
        status=kb.status.value, chunk_count=kb.chunk_count,
        error_message=kb.error_message,
    ) for kb in kbs]


@router.post("/upload", response_model=KBResponse, status_code=201)
async def upload_file(
    assistant_id: str,
    name: str = Form(...),
    file: UploadFile = File(...),
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    assistant = await _get_assistant(assistant_id, workspace, db)

    # Validate file size (10 MB max)
    MAX_FILE_SIZE = 10 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Le fichier ne doit pas dépasser 10 Mo")

    collection_name = f"emefa_{assistant.id.hex}"

    kb = KnowledgeBase(
        assistant_id=assistant.id,
        name=name,
        source_type=KBSourceType.FILE,
        source_ref=file.filename,
        collection_name=collection_name,
        status=KBStatus.PROCESSING,
    )
    db.add(kb)
    await db.flush()

    try:
        text = extract_text_from_file(content, file.filename or "file.txt")
        chunk_count = await ingest_text(
            collection_name, text, str(kb.id), name, assistant.llm_provider
        )
        kb.chunk_count = chunk_count
        kb.status = KBStatus.READY
    except Exception as e:
        kb.status = KBStatus.ERROR
        kb.error_message = str(e)[:500]

    await db.commit()
    return KBResponse(
        id=str(kb.id), assistant_id=str(kb.assistant_id),
        name=kb.name, source_type=kb.source_type.value,
        status=kb.status.value, chunk_count=kb.chunk_count,
        error_message=kb.error_message,
    )


@router.post("/url", response_model=KBResponse, status_code=201)
async def add_url(
    assistant_id: str,
    req: KBCreateURL,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    assistant = await _get_assistant(assistant_id, workspace, db)
    collection_name = f"emefa_{assistant.id.hex}"

    kb = KnowledgeBase(
        assistant_id=assistant.id,
        name=req.name,
        source_type=KBSourceType.URL,
        source_ref=req.url,
        collection_name=collection_name,
        status=KBStatus.PROCESSING,
    )
    db.add(kb)
    await db.flush()

    try:
        text = await crawl_url(req.url)
        chunk_count = await ingest_text(
            collection_name, text, str(kb.id), req.name, assistant.llm_provider
        )
        kb.chunk_count = chunk_count
        kb.status = KBStatus.READY
    except Exception as e:
        kb.status = KBStatus.ERROR
        kb.error_message = str(e)[:500]

    await db.commit()
    return KBResponse(
        id=str(kb.id), assistant_id=str(kb.assistant_id),
        name=kb.name, source_type=kb.source_type.value,
        status=kb.status.value, chunk_count=kb.chunk_count,
        error_message=kb.error_message,
    )


@router.post("/text", response_model=KBResponse, status_code=201)
async def add_text(
    assistant_id: str,
    req: KBCreateText,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    assistant = await _get_assistant(assistant_id, workspace, db)
    collection_name = f"emefa_{assistant.id.hex}"

    kb = KnowledgeBase(
        assistant_id=assistant.id,
        name=req.name,
        source_type=KBSourceType.TEXT,
        raw_text=req.text,
        collection_name=collection_name,
        status=KBStatus.PROCESSING,
    )
    db.add(kb)
    await db.flush()

    try:
        chunk_count = await ingest_text(
            collection_name, req.text, str(kb.id), req.name, assistant.llm_provider
        )
        kb.chunk_count = chunk_count
        kb.status = KBStatus.READY
    except Exception as e:
        kb.status = KBStatus.ERROR
        kb.error_message = str(e)[:500]

    await db.commit()
    return KBResponse(
        id=str(kb.id), assistant_id=str(kb.assistant_id),
        name=kb.name, source_type=kb.source_type.value,
        status=kb.status.value, chunk_count=kb.chunk_count,
        error_message=kb.error_message,
    )


@router.delete("/{kb_id}", status_code=204)
async def delete_knowledge_base(
    assistant_id: str,
    kb_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    assistant = await _get_assistant(assistant_id, workspace, db)
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == uuid.UUID(kb_id),
            KnowledgeBase.assistant_id == assistant.id,
        )
    )
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    # Clean up vector DB - only delete points for this KB, not the entire collection
    if kb.collection_name:
        try:
            await delete_points_by_source(kb.collection_name, str(kb.id))
        except Exception:
            pass

    await db.delete(kb)
    await db.commit()
