"""RAG pipeline - ingestion + retrieval using Qdrant vector DB."""

import hashlib
import io
import uuid
from typing import Optional

import httpx
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from app.core.config import get_settings
from app.services.llm_service import get_llm_provider

settings = get_settings()

# Chunk settings
CHUNK_SIZE = 512
CHUNK_OVERLAP = 64
EMBED_DIM = 768  # nomic-embed-text default


def _get_qdrant() -> AsyncQdrantClient:
    return AsyncQdrantClient(
        host=settings.QDRANT_HOST,
        port=settings.QDRANT_PORT,
        api_key=settings.QDRANT_API_KEY,
    )


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text into overlapping chunks."""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i : i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
        i += chunk_size - overlap
    return chunks


async def ensure_collection(collection_name: str):
    """Create Qdrant collection if it doesn't exist."""
    client = _get_qdrant()
    try:
        collections = await client.get_collections()
        names = [c.name for c in collections.collections]
        if collection_name not in names:
            await client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=EMBED_DIM, distance=Distance.COSINE),
            )
    finally:
        await client.close()


async def ingest_text(
    collection_name: str,
    text: str,
    source_id: str,
    source_name: str,
    provider_name: Optional[str] = None,
) -> int:
    """Chunk text, embed, and store in Qdrant. Returns chunk count."""
    chunks = chunk_text(text)
    if not chunks:
        return 0

    llm = get_llm_provider(provider_name)
    embeddings = await llm.embed(chunks)

    await ensure_collection(collection_name)
    client = _get_qdrant()
    try:
        points = []
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            point_id = str(uuid.uuid4())
            points.append(
                PointStruct(
                    id=point_id,
                    vector=emb,
                    payload={
                        "text": chunk,
                        "source_id": source_id,
                        "source_name": source_name,
                        "chunk_index": i,
                    },
                )
            )
        await client.upsert(collection_name=collection_name, points=points)
    finally:
        await client.close()

    return len(chunks)


async def search_knowledge(
    collection_name: str,
    query: str,
    top_k: int = 5,
    provider_name: Optional[str] = None,
) -> list[dict]:
    """Search Qdrant for relevant chunks. Returns list of {text, source_name, score}."""
    llm = get_llm_provider(provider_name)
    query_emb = (await llm.embed([query]))[0]

    client = _get_qdrant()
    try:
        results = await client.search(
            collection_name=collection_name,
            query_vector=query_emb,
            limit=top_k,
            score_threshold=0.3,
        )
    finally:
        await client.close()

    return [
        {
            "text": r.payload.get("text", ""),
            "source_name": r.payload.get("source_name", ""),
            "source_id": r.payload.get("source_id", ""),
            "score": r.score,
        }
        for r in results
    ]


async def delete_collection(collection_name: str):
    """Delete a Qdrant collection."""
    client = _get_qdrant()
    try:
        await client.delete_collection(collection_name)
    finally:
        await client.close()


def extract_text_from_file(content: bytes, filename: str) -> str:
    """Extract text from uploaded files (PDF, DOC, TXT)."""
    lower = filename.lower()
    if lower.endswith(".txt"):
        return content.decode("utf-8", errors="replace")
    elif lower.endswith(".pdf"):
        try:
            import pymupdf
            doc = pymupdf.open(stream=content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text() + "\n"
            return text
        except ImportError:
            # Fallback: try pdfplumber
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                return "\n".join(page.extract_text() or "" for page in pdf.pages)
    elif lower.endswith((".doc", ".docx")):
        import docx
        doc = docx.Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)
    else:
        return content.decode("utf-8", errors="replace")


async def crawl_url(url: str) -> str:
    """Crawl a URL and extract text content."""
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        resp = await client.get(url, headers={"User-Agent": "EMEFA-Bot/1.0"})
        resp.raise_for_status()
        html = resp.text

    # Simple HTML to text extraction
    import re
    # Remove scripts and styles
    text = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)
    # Remove tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Clean whitespace
    text = re.sub(r"\s+", " ", text).strip()
    # Decode HTML entities
    import html as html_lib
    text = html_lib.unescape(text)
    return text
