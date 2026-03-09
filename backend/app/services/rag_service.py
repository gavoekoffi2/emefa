"""RAG pipeline - ingestion + retrieval using Qdrant vector DB."""

import hashlib
import io
import uuid
from typing import Optional

import httpx
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, FieldCondition, Filter, MatchValue, PointStruct, VectorParams

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
    """Delete a Qdrant collection entirely."""
    client = _get_qdrant()
    try:
        await client.delete_collection(collection_name)
    finally:
        await client.close()


async def delete_points_by_source(collection_name: str, source_id: str):
    """Delete only points belonging to a specific source (knowledge base) from a collection."""
    client = _get_qdrant()
    try:
        await client.delete(
            collection_name=collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="source_id",
                        match=MatchValue(value=source_id),
                    )
                ]
            ),
        )
    finally:
        await client.close()


def _validate_file_type(content: bytes, filename: str) -> None:
    """Validate file content matches expected type using magic bytes."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        if not content[:5].startswith(b"%PDF-"):
            raise ValueError("File does not appear to be a valid PDF (invalid magic bytes)")


def extract_text_from_file(content: bytes, filename: str) -> str:
    """Extract text from uploaded files (PDF, DOC, TXT, CSV, MD)."""
    _validate_file_type(content, filename)
    lower = filename.lower()
    if lower.endswith(".txt") or lower.endswith(".md"):
        return content.decode("utf-8", errors="replace")
    elif lower.endswith(".csv"):
        import csv
        text_content = content.decode("utf-8", errors="replace")
        reader = csv.reader(io.StringIO(text_content))
        rows = []
        for row in reader:
            rows.append(" | ".join(row))
        return "\n".join(rows)
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


def _validate_url(url: str) -> None:
    """Validate URL to prevent SSRF attacks."""
    from urllib.parse import urlparse
    import ipaddress

    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError(f"Unsupported URL scheme: {parsed.scheme}")
    if not parsed.hostname:
        raise ValueError("URL must have a hostname")

    # Block private/internal hostnames
    hostname = parsed.hostname.lower()
    blocked_hosts = {"localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal", "169.254.169.254"}
    if hostname in blocked_hosts:
        raise ValueError("URL points to a blocked host")

    # Block private IP ranges
    try:
        ip = ipaddress.ip_address(hostname)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise ValueError("URL points to a private/internal IP address")
    except ValueError:
        pass  # Not an IP address, it's a hostname - that's fine


async def crawl_url(url: str) -> str:
    """Crawl a URL and extract text content."""
    _validate_url(url)

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=False) as client:
        resp = await client.get(url, headers={"User-Agent": "EMEFA-Bot/1.0"})
        # Follow redirects manually to validate each hop
        redirects = 0
        while resp.is_redirect and redirects < 5:
            redirect_url = str(resp.next_request.url) if resp.next_request else None
            if not redirect_url:
                break
            _validate_url(redirect_url)
            resp = await client.get(redirect_url, headers={"User-Agent": "EMEFA-Bot/1.0"})
            redirects += 1

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
