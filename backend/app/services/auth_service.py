"""Authentication service."""

import hashlib
import logging
import re
import time
import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import RefreshToken, User, Workspace, WorkspaceMember, WorkspaceRole

logger = logging.getLogger("emefa.auth")

# Account lockout tracking: {email: {"count": int, "first_attempt": float, "locked_until": float}}
_failed_attempts: dict[str, dict] = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION = 15 * 60  # 15 minutes in seconds


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


def _check_lockout(email: str) -> None:
    """Check if account is locked out due to failed attempts."""
    record = _failed_attempts.get(email)
    if not record:
        return
    now = time.time()
    # Clear expired lockouts
    if record.get("locked_until") and now > record["locked_until"]:
        del _failed_attempts[email]
        return
    if record.get("locked_until") and now <= record["locked_until"]:
        remaining = int(record["locked_until"] - now)
        raise ValueError(f"Account temporarily locked. Try again in {remaining // 60 + 1} minutes.")


def _record_failed_attempt(email: str) -> None:
    """Record a failed login attempt."""
    now = time.time()
    record = _failed_attempts.get(email)
    if not record or (now - record.get("first_attempt", 0)) > LOCKOUT_DURATION:
        _failed_attempts[email] = {"count": 1, "first_attempt": now}
        return
    record["count"] += 1
    if record["count"] >= MAX_FAILED_ATTEMPTS:
        record["locked_until"] = now + LOCKOUT_DURATION
        logger.warning(f"Account locked due to {MAX_FAILED_ATTEMPTS} failed attempts: {email}")


def _clear_failed_attempts(email: str) -> None:
    """Clear failed attempts on successful login."""
    _failed_attempts.pop(email, None)


async def login_user(db: AsyncSession, email: str, password: str) -> tuple[User, dict]:
    _check_lockout(email)

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.hashed_password:
        _record_failed_attempt(email)
        raise ValueError("Invalid credentials")
    if not verify_password(password, user.hashed_password):
        _record_failed_attempt(email)
        raise ValueError("Invalid credentials")
    if not user.is_active:
        raise ValueError("Account is deactivated")

    _clear_failed_attempts(email)
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


async def revoke_all_refresh_tokens(db: AsyncSession, user_id: uuid.UUID) -> int:
    """Revoke all refresh tokens for a user. Returns count of revoked tokens."""
    result = await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.is_revoked == False)
        .values(is_revoked=True)
    )
    return result.rowcount
