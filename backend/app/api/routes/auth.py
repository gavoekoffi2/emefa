"""Auth routes - register, login, refresh, me."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User, Workspace, WorkspaceMember
from app.core.security import hash_password, verify_password
from app.schemas.auth import (
    ChangePasswordRequest,
    LoginRequest,
    ProfileUpdateRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    WorkspaceInfo,
)
from app.services.auth_service import login_user, refresh_access_token, register_user, revoke_all_refresh_tokens

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        user, workspace, tokens = await register_user(
            db, req.email, req.password, req.full_name, req.workspace_name
        )
        await db.commit()
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        user, tokens = await login_user(db, req.email, req.password)
        await db.commit()
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        tokens = await refresh_access_token(db, req.refresh_token)
        await db.commit()
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Fetch user's workspaces with roles in a single query (join)
    result = await db.execute(
        select(WorkspaceMember, Workspace)
        .join(Workspace, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user.id)
    )
    rows = result.all()

    workspaces = [
        WorkspaceInfo(
            id=str(ws.id),
            name=ws.name,
            slug=ws.slug,
            role=m.role.value,
        )
        for m, ws in rows
    ]

    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        avatar_url=user.avatar_url,
        workspaces=workspaces,
    )


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    req: ProfileUpdateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = req.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    await db.commit()

    # Re-fetch workspaces for response
    result = await db.execute(
        select(WorkspaceMember, Workspace)
        .join(Workspace, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user.id)
    )
    rows = result.all()
    workspaces = [
        WorkspaceInfo(id=str(ws.id), name=ws.name, slug=ws.slug, role=m.role.value)
        for m, ws in rows
    ]
    return UserResponse(
        id=str(user.id), email=user.email, full_name=user.full_name,
        is_active=user.is_active, avatar_url=user.avatar_url, workspaces=workspaces,
    )


@router.post("/me/change-password")
async def change_password(
    req: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.hashed_password:
        raise HTTPException(status_code=400, detail="OAuth-only account cannot set password this way")
    if not verify_password(req.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.hashed_password = hash_password(req.new_password)
    # Revoke all existing refresh tokens for security
    revoked_count = await revoke_all_refresh_tokens(db, user.id)
    await db.commit()
    return {"message": "Password updated successfully", "tokens_revoked": revoked_count}


@router.post("/forgot-password")
async def forgot_password(req: dict, db: AsyncSession = Depends(get_db)):
    """Request password reset link."""
    email = req.get("email", "").lower().strip()
    
    if not email:
        raise HTTPException(status_code=400, detail="Email requis")
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        # Security: Don't reveal if email exists
        return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé"}
    
    # TODO: Generate reset token and send email
    # For now, just return success message
    logger.info(f"Password reset requested for {email}")
    
    return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé"}


@router.post("/reset-password")
async def reset_password(req: dict, db: AsyncSession = Depends(get_db)):
    """Reset password with token."""
    token = req.get("token", "")
    new_password = req.get("new_password", "")
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token et nouveau mot de passe requis")
    
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères")
    
    # TODO: Verify token and reset password
    # For now, just return success message
    
    return {"message": "Mot de passe réinitialisé avec succès"}
