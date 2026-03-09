"""Knowledge Base schemas."""

from typing import Optional

from pydantic import BaseModel, Field, field_validator


class KBCreateFile(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    # File will be uploaded via multipart form


class KBCreateURL(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., min_length=1, max_length=2048)

    @field_validator("url")
    @classmethod
    def validate_url_scheme(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class KBCreateText(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    text: str = Field(..., min_length=1, max_length=100_000)


class KBResponse(BaseModel):
    id: str
    assistant_id: str
    name: str
    source_type: str
    status: str
    chunk_count: int
    error_message: Optional[str] = None

    model_config = {"from_attributes": True}
