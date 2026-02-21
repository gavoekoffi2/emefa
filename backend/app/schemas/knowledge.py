"""Knowledge Base schemas."""

from typing import Optional

from pydantic import BaseModel


class KBCreateFile(BaseModel):
    name: str
    # File will be uploaded via multipart form


class KBCreateURL(BaseModel):
    name: str
    url: str


class KBCreateText(BaseModel):
    name: str
    text: str


class KBResponse(BaseModel):
    id: str
    assistant_id: str
    name: str
    source_type: str
    status: str
    chunk_count: int
    error_message: Optional[str] = None

    model_config = {"from_attributes": True}
