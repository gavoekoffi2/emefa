# EMEFA - Guide d'Installation

## Pr\u00e9requis

- Docker + Docker Compose (recommand\u00e9)
- OU: Python 3.12+, Node.js 20+, PostgreSQL 16+, Redis 7+

## Installation Rapide (Docker)

```bash
# 1. Cloner le repo
git clone <repo-url> emefa && cd emefa

# 2. Copier la configuration
cp .env.example .env
# \u00c9diter .env avec vos cl\u00e9s (JWT_SECRET, ENCRYPTION_KEY, etc.)

# 3. G\u00e9n\u00e9rer les cl\u00e9s de s\u00e9curit\u00e9
python -c "import secrets; print('JWT_SECRET=' + secrets.token_hex(32))"
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())"

# 4. Lancer tous les services
docker compose up -d

# 5. T\u00e9l\u00e9charger le mod\u00e8le Ollama (premi\u00e8re fois)
docker compose exec ollama ollama pull llama3.2:3b
docker compose exec ollama ollama pull nomic-embed-text

# 6. Cr\u00e9er les tables DB (migrations)
docker compose exec backend alembic upgrade head

# 7. Acc\u00e9der \u00e0 l'app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Installation Locale (D\u00e9veloppement)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# D\u00e9marrer PostgreSQL et Redis (local ou Docker)
docker compose up postgres redis qdrant -d

# Migrations
alembic upgrade head

# Lancer le backend
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Accessible sur http://localhost:3000
```

### IronClaw (Agent Runtime)

```bash
# Option 1: Docker
docker compose up ironclaw -d

# Option 2: Build from source (n\u00e9cessite Rust 1.85+)
git clone https://github.com/nearai/ironclaw.git
cd ironclaw
cargo build --release
./target/release/ironclaw onboard  # Configuration guid\u00e9e
```

### LiveKit

```bash
docker compose up livekit -d
# Ou installer nativement: https://docs.livekit.io/home/self-hosting/local/
```

### Ollama (LLM local)

```bash
docker compose up ollama -d
docker compose exec ollama ollama pull llama3.2:3b
docker compose exec ollama ollama pull nomic-embed-text
```

## Installation VPS (Production)

### 1. Serveur minimum
- 4 vCPU, 8 GB RAM, 50 GB SSD
- Ubuntu 22.04+ ou Debian 12+
- Docker + Docker Compose install\u00e9s

### 2. Configuration
```bash
# Copier et \u00e9diter .env
cp .env.example .env

# Variables CRITIQUES \u00e0 changer :
# - SECRET_KEY (openssl rand -hex 32)
# - JWT_SECRET (openssl rand -hex 32)
# - ENCRYPTION_KEY (python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())")
# - ALLOWED_ORIGINS (votre domaine)
# - DATABASE_URL (si PostgreSQL externe)
```

### 3. HTTPS (Reverse Proxy)
Utilisez Nginx ou Caddy devant les services :
```
Frontend (3000) -> https://emefa.votredomaine.com
Backend (8000) -> https://api.emefa.votredomaine.com
LiveKit (7880) -> wss://livekit.votredomaine.com
```

### 4. Lancer en production
```bash
docker compose -f docker-compose.yml up -d
```

## WhatsApp QR Bridge (Optionnel)

**ATTENTION** : Service non-officiel. Risques de ban.

```bash
# Activer dans .env
WHATSAPP_QR_ENABLED=true

# Lancer avec le profil sp\u00e9cifique
docker compose --profile whatsapp-qr up -d
```

## Services et Ports

| Service      | Port  | Description                |
|-------------|-------|----------------------------|
| Frontend    | 3000  | Interface web Next.js      |
| Backend     | 8000  | API FastAPI                |
| PostgreSQL  | 5432  | Base de donn\u00e9es            |
| Redis       | 6379  | Cache / queues             |
| Qdrant      | 6333  | Base vectorielle           |
| MinIO       | 9000  | Stockage S3                |
| Ollama      | 11434 | LLM local                  |
| LiveKit     | 7880  | Serveur WebRTC             |
| IronClaw    | 8090  | Agent runtime              |
| WA QR       | 8095  | Bridge WhatsApp (optionnel)|
