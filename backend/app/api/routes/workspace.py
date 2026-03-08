"""Workspace management routes - members, invites, settings."""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_workspace, require_admin, require_owner
from app.models.user import User, Workspace, WorkspaceMember, WorkspaceRole
from app.schemas.auth import WorkspaceResponse

router = APIRouter(prefix="/workspace", tags=["workspace"])


class MemberResponse(BaseModel):
    id: str
    user_id: str
    email: str
    full_name: str
    role: str
    avatar_url: str | None = None


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: str = "member"


class UpdateMemberRoleRequest(BaseModel):
    role: str


class UpdateWorkspaceRequest(BaseModel):
    name: str | None = None


@router.get("", response_model=WorkspaceResponse)
async def get_workspace(
    workspace: Workspace = Depends(get_current_workspace),
):
    return WorkspaceResponse(
        id=str(workspace.id),
        name=workspace.name,
        slug=workspace.slug,
        is_active=workspace.is_active,
        token_budget_daily=workspace.token_budget_daily,
        tokens_used_today=workspace.tokens_used_today,
    )


@router.patch("", response_model=WorkspaceResponse)
async def update_workspace(
    req: UpdateWorkspaceRequest,
    workspace: Workspace = Depends(get_current_workspace),
    _admin: WorkspaceMember = require_admin(),
    db: AsyncSession = Depends(get_db),
):
    if req.name is not None:
        workspace.name = req.name
    await db.commit()
    return WorkspaceResponse(
        id=str(workspace.id),
        name=workspace.name,
        slug=workspace.slug,
        is_active=workspace.is_active,
        token_budget_daily=workspace.token_budget_daily,
        tokens_used_today=workspace.tokens_used_today,
    )


@router.get("/members", response_model=list[MemberResponse])
async def list_members(
    workspace: Workspace = Depends(get_current_workspace),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkspaceMember, User)
        .join(User, WorkspaceMember.user_id == User.id)
        .where(WorkspaceMember.workspace_id == workspace.id)
    )
    rows = result.all()
    return [
        MemberResponse(
            id=str(m.id),
            user_id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            role=m.role.value,
            avatar_url=u.avatar_url,
        )
        for m, u in rows
    ]


@router.post("/members", response_model=MemberResponse, status_code=201)
async def invite_member(
    req: InviteMemberRequest,
    workspace: Workspace = Depends(get_current_workspace),
    _admin: WorkspaceMember = require_admin(),
    db: AsyncSession = Depends(get_db),
):
    # Validate role
    valid_roles = {"member": WorkspaceRole.MEMBER, "admin": WorkspaceRole.ADMIN}
    role = valid_roles.get(req.role)
    if not role:
        raise HTTPException(status_code=400, detail="Role must be 'member' or 'admin'")

    # Find user by email
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. They must register first.")

    # Check if already a member
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace.id,
            WorkspaceMember.user_id == user.id,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User is already a member of this workspace")

    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role=role,
    )
    db.add(member)
    await db.commit()

    return MemberResponse(
        id=str(member.id),
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=member.role.value,
        avatar_url=user.avatar_url,
    )


@router.patch("/members/{member_id}", response_model=MemberResponse)
async def update_member_role(
    member_id: str,
    req: UpdateMemberRoleRequest,
    workspace: Workspace = Depends(get_current_workspace),
    _owner: WorkspaceMember = require_owner(),
    db: AsyncSession = Depends(get_db),
):
    valid_roles = {"member": WorkspaceRole.MEMBER, "admin": WorkspaceRole.ADMIN}
    role = valid_roles.get(req.role)
    if not role:
        raise HTTPException(status_code=400, detail="Role must be 'member' or 'admin'")

    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.id == uuid.UUID(member_id),
            WorkspaceMember.workspace_id == workspace.id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.role == WorkspaceRole.OWNER:
        raise HTTPException(status_code=403, detail="Cannot change the owner's role")

    member.role = role
    await db.commit()

    # Fetch user info for response
    result = await db.execute(select(User).where(User.id == member.user_id))
    user = result.scalar_one()
    return MemberResponse(
        id=str(member.id),
        user_id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=member.role.value,
        avatar_url=user.avatar_url,
    )


@router.delete("/members/{member_id}", status_code=204)
async def remove_member(
    member_id: str,
    workspace: Workspace = Depends(get_current_workspace),
    _admin: WorkspaceMember = require_admin(),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.id == uuid.UUID(member_id),
            WorkspaceMember.workspace_id == workspace.id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    if member.role == WorkspaceRole.OWNER:
        raise HTTPException(status_code=403, detail="Cannot remove the workspace owner")

    if member.user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself. Transfer ownership first.")

    await db.delete(member)
    await db.commit()
