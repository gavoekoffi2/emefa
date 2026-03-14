#!/bin/bash
# ==========================================
# EMEFA Platform - Deployment Script
# ==========================================

set -e

echo "🚀 EMEFA Platform - Deployment"
echo "================================"

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker requis"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker compose >/dev/null 2>&1 || { echo "❌ Docker Compose requis"; exit 1; }

# Load environment
if [ ! -f .env ]; then
    echo "📝 Copie de .env.example vers .env..."
    cp .env.example .env
    echo "⚠️  Éditez .env avec vos vraies valeurs avant de continuer!"
    echo "   Variables CRITIQUES: SECRET_KEY, JWT_SECRET, ENCRYPTION_KEY, DB_PASSWORD"
    exit 1
fi

source .env

# Generate SSL certs if not exist
SSL_DIR="./infra/nginx/ssl"
if [ ! -f "$SSL_DIR/selfsigned.crt" ]; then
    echo "🔐 Génération des certificats SSL auto-signés..."
    mkdir -p "$SSL_DIR"
    openssl req -x509 -nodes -days 365 \
        -newkey rsa:2048 \
        -keyout "$SSL_DIR/selfsigned.key" \
        -out "$SSL_DIR/selfsigned.crt" \
        -subj "/C=TG/ST=Maritime/L=Lome/O=EMEFA/CN=localhost"
    echo "✅ Certificats SSL générés"
fi

# Build and start
echo "🏗️  Build des images Docker..."
docker compose -f docker-compose.prod.yml build

echo "🚀 Démarrage des services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for postgres
echo "⏳ Attente de PostgreSQL..."
sleep 10

# Run migrations
echo "📊 Exécution des migrations..."
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

echo ""
echo "✅ EMEFA Platform déployée avec succès!"
echo ""
echo "🌐 Frontend: https://localhost"
echo "🔧 API:      https://localhost/api/v1"
echo "📚 Docs:     https://localhost/docs"
echo ""
echo "📋 Commandes utiles:"
echo "   Logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "   Stop:     docker compose -f docker-compose.prod.yml down"
echo "   Restart:  docker compose -f docker-compose.prod.yml restart"
echo ""
