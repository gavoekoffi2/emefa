"""Add integrations and platform API keys tables.

Revision ID: 003
Revises: 002_architect_template
Create Date: 2026-03-14
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '003_integrations'
down_revision = '002_architect_template'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # User Integrations table
    op.create_table(
        'user_integrations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('provider', sa.String(50), nullable=False, index=True),
        sa.Column('status', sa.String(20), default='disconnected', index=True),
        sa.Column('credentials', sa.JSON, default=dict),
        sa.Column('phone_number', sa.String(20), nullable=True),
        sa.Column('bot_token', sa.Text, nullable=True),
        sa.Column('bot_username', sa.String(255), nullable=True),
        sa.Column('session_data', sa.Text, nullable=True),
        sa.Column('oauth_token', sa.Text, nullable=True),
        sa.Column('oauth_refresh_token', sa.Text, nullable=True),
        sa.Column('api_key', sa.Text, nullable=True),
        sa.Column('provider_name', sa.String(100), nullable=True),
        sa.Column('webhook_url', sa.String(500), nullable=True),
        sa.Column('webhook_secret', sa.String(255), nullable=True),
        sa.Column('messages_sent', sa.String(20), default='0'),
        sa.Column('messages_received', sa.String(20), default='0'),
        sa.Column('last_activity_at', sa.DateTime, nullable=True),
        sa.Column('connected_at', sa.DateTime, nullable=True),
        sa.Column('disconnected_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )

    # Platform API Keys table
    op.create_table(
        'platform_api_keys',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('provider', sa.String(100), nullable=False, index=True),
        sa.Column('api_key', sa.Text, nullable=False),
        sa.Column('is_active', sa.Boolean, default=True, index=True),
        sa.Column('usage_count', sa.String(20), default='0'),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('last_used_at', sa.DateTime, nullable=True),
        sa.Column('created_by', sa.String(36), sa.ForeignKey('users.id'), nullable=True),
    )

    # Skills tables
    op.create_table(
        'skills',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False, index=True),
        sa.Column('slug', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('documentation', sa.Text, nullable=True),
        sa.Column('category', sa.String(50), nullable=False, index=True),
        sa.Column('tags', sa.JSON, default=list),
        sa.Column('status', sa.String(20), default='draft', index=True),
        sa.Column('version', sa.String(20), default='0.0.1'),
        sa.Column('latest_version', sa.String(20), default='0.0.1'),
        sa.Column('config_schema', sa.JSON, default=dict),
        sa.Column('prompt_template', sa.Text, nullable=True),
        sa.Column('system_message', sa.Text, nullable=True),
        sa.Column('author_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('author_name', sa.String(255), nullable=False),
        sa.Column('organization_id', sa.String(36), nullable=True),
        sa.Column('usage_count', sa.Integer, default=0, index=True),
        sa.Column('installation_count', sa.Integer, default=0),
        sa.Column('rating', sa.Integer, default=0),
        sa.Column('is_public', sa.Boolean, default=False, index=True),
        sa.Column('is_official', sa.Boolean, default=False),
        sa.Column('requires_api_key', sa.Boolean, default=False),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('published_at', sa.DateTime, nullable=True),
    )

    op.create_table(
        'skill_installations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('skill_id', sa.String(36), sa.ForeignKey('skills.id'), nullable=False, index=True),
        sa.Column('assistant_id', sa.String(36), sa.ForeignKey('assistants.id'), nullable=False, index=True),
        sa.Column('configuration', sa.JSON, default=dict),
        sa.Column('is_active', sa.Boolean, default=True, index=True),
        sa.Column('usage_count', sa.Integer, default=0),
        sa.Column('last_used_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )

    op.create_table(
        'skill_marketplace_entries',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('skill_id', sa.String(36), sa.ForeignKey('skills.id'), nullable=True),
        sa.Column('title', sa.String(255), nullable=False, index=True),
        sa.Column('short_description', sa.String(500), nullable=False),
        sa.Column('long_description', sa.Text, nullable=True),
        sa.Column('icon_url', sa.String(500), nullable=True),
        sa.Column('categories', sa.JSON, default=list),
        sa.Column('industries', sa.JSON, default=list),
        sa.Column('is_free', sa.Boolean, default=True),
        sa.Column('pricing_type', sa.String(50), default='free'),
        sa.Column('downloads', sa.Integer, default=0),
        sa.Column('rating', sa.Integer, default=0),
        sa.Column('reviews_count', sa.Integer, default=0),
        sa.Column('is_featured', sa.Boolean, default=False, index=True),
        sa.Column('is_verified', sa.Boolean, default=False, index=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('skill_marketplace_entries')
    op.drop_table('skill_installations')
    op.drop_table('skills')
    op.drop_table('platform_api_keys')
    op.drop_table('user_integrations')
