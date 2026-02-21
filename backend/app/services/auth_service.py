"""Authentication service."""

import hashlib
import re
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import RefreshToken, User, Workspace, WorkspaceMember, WorkspaceRole


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return f"{slug}-{uuid.uuid4().hex[:6]}"


async def register_user(
    db: AsyncSession, email: str, password: str, full_name: str, workspace_name: str | None = None
) -> tuple[User, Workspace, dict]:
    # Check existing
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise ValueError("Email already registered")

    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
    )
    db.add(user)
    await db.flush()

    # Create default workspace
    ws_name = workspace_name or f"{full_name}'s Workspace"
    workspace = Workspace(name=ws_name, slug=_slugify(ws_name))
    db.add(workspace)
    await db.flush()

    member = WorkspaceMember(workspace_id=workspace.id, user_id=user.id, role=WorkspaceRole.OWNER)
    db.add(member)

    tokens = await _create_tokens(db, user)
    return user, workspace, tokens


async def login_user(db: AsyncSession, email: str, password: str) -> tuple[User, dict]:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password:
        raise ValueError("Invalid credentials")
    if not verify_password(password, user.hashed_password):
        raise ValueError("Invalid credentials")
    if not user.is_active:
        raise ValueError("Account is deactivated")

    tokens = await _create_tokens(db, user)
    return user, tokens


async def refresh_access_token(db: AsyncSession, refresh_token_str: str) -> dict:
    try:
        payload = decode_token(refresh_token_str)
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
    except Exception:
        raise ValueError("Invalid or expired refresh token")

    token_hash = hashlib.sha256(refresh_token_str.encode()).hexdigest()
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash, RefreshToken.is_revoked == False)
    )
    stored = result.scalar_one_or_none()
    if not stored:
        raise ValueError("Refresh token not found or revoked")

    # Revoke old token
    stored.is_revoked = True

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")

    return await _create_tokens(db, user)


async def _create_tokens(db: AsyncSession, user: User) -> dict:
    access = create_access_token({"sub": str(user.id), "email": user.email})
    refresh = create_refresh_token({"sub": str(user.id)})

    # Store hashed refresh token
    token_hash = hashlib.sha256(refresh.encode()).hexdigest()
    db.add(RefreshToken(user_id=user.id, token_hash=token_hash))

    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer"}
