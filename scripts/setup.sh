#!/bin/bash
# ==========================================
# EMEFA Platform - Initial Setup
# ==========================================

set -e

echo "🔧 EMEFA Platform - Setup Initial"
echo "==================================="

# Generate secrets
echo "🔐 Génération des clés de sécurité..."

SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
DB_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)
S3_ACCESS_KEY=$(openssl rand -hex 16)
S3_SECRET_KEY=$(openssl rand -hex 32)

# Generate Fernet key
ENCRYPTION_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())" 2>/dev/null || echo "CHANGE-ME-FERNET-KEY")

# Create .env file
cat > .env << EOF
# ===================================
# EMEFA Platform - Production Config
# Auto-generated on $(date)
# ===================================

# App
APP_NAME=EMEFA
DEBUG=false
SECRET_KEY=${SECRET_KEY}
ALLOWED_ORIGINS=["https://your-domain.com"]

# Database
DB_USER=emefa
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=emefa
DATABASE_URL=postgresql+asyncpg://emefa:${DB_PASSWORD}@postgres:5432/emefa

# Redis
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379/0

# Auth
JWT_SECRET=${JWT_SECRET}
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Encryption
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Qdrant
QDRANT_HOST=qdrant
QDRANT_PORT=6333

# MinIO / S3
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=${S3_ACCESS_KEY}
S3_SECRET_KEY=${S3_SECRET_KEY}
S3_BUCKET=emefa-uploads

# LLM Provider
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-key-here
OPENROUTER_MODEL=openrouter/hunter-alpha

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
TOKEN_BUDGET_PER_USER_DAILY=100000
EOF

echo "✅ Fichier .env créé avec des clés sécurisées"
echo ""
echo "⚠️  IMPORTANT: Éditez .env pour configurer:"
echo "   1. ALLOWED_ORIGINS (votre domaine)"
echo "   2. OPENROUTER_API_KEY (votre clé OpenRouter)"
echo ""
echo "🚀 Ensuite, lancez: bash scripts/deploy.sh"
