# EMEFA Deployment Guide

## 🚀 Quick Start Deployment

### Option 1: Docker Compose (Dev/Staging)

```bash
# Clone and setup
git clone <repo>
cd emefa

# Create env file
cp .env.example .env
# Edit .env with your credentials

# Start services
docker-compose up -d

# Create database
docker-compose exec backend alembic upgrade head

# Test
curl http://localhost:8000/health
```

### Option 2: Production (Recommended)

#### Prerequisites
- Linux server (Ubuntu 22.04 LTS recommended)
- Docker + Docker Compose
- Domain name with SSL
- PostgreSQL 15+ (managed or self-hosted)
- Redis 7+ (managed or self-hosted)

#### Step 1: Server Setup

```bash
# SSH into server
ssh root@your-server.com

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose

# Create app directory
mkdir -p /var/www/emefa
cd /var/www/emefa
```

#### Step 2: Prepare Environment

```bash
# Create .env with production settings
cat > .env << 'EOF'
# Database (use managed service for production)
DATABASE_URL=postgresql+asyncpg://user:strong_password@db.example.com:5432/emefa_prod

# Redis
REDIS_URL=redis://redis.example.com:6379/0

# Security
SECRET_KEY=$(openssl rand -hex 32)
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_TOKEN=$(openssl rand -hex 16)

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# Google Sheets
GOOGLE_SHEETS_CREDENTIALS=/app/config/gsheet-credentials.json

# SMS
SMS_PROVIDER=africastalking
AFRICAS_TALKING_API_KEY=your_api_key
AFRICAS_TALKING_USERNAME=your_username

# Payments
PAYMENT_PROVIDER=paystack
PAYSTACK_SECRET_KEY=your_secret_key

# LLM
ANTHROPIC_API_KEY=your_api_key

# Features
DEBUG=False
LOG_LEVEL=INFO
ALLOWED_ORIGINS=https://emefa.ai,https://app.emefa.ai
APP_VERSION=0.2.0

# Workers
WORKER_PROCESSES=4
WORKER_THREADS=2
EOF
```

#### Step 3: Deploy Application

```bash
# Clone repository
git clone <your-repo> .

# Create config directory
mkdir -p backend/config

# Copy service account key (if using Google Sheets)
# scp ~/service-account-key.json root@server:/var/www/emefa/backend/config/

# Build and start
docker-compose -f docker-compose.prod.yml up -d

# Verify
docker-compose logs backend | grep "EMEFA Platform starting up"
```

#### Step 4: Setup Nginx Reverse Proxy

```bash
# Install Nginx
apt install -y nginx certbot python3-certbot-nginx

# Create Nginx config
cat > /etc/nginx/sites-available/emefa << 'EOF'
upstream emefa_backend {
    server backend:8000;
}

server {
    listen 80;
    server_name emefa.ai www.emefa.ai;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name emefa.ai www.emefa.ai;
    
    ssl_certificate /etc/letsencrypt/live/emefa.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/emefa.ai/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    
    # Proxying
    location / {
        proxy_pass http://emefa_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://emefa_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 3600s;
    }
}
EOF

# Enable site
ln -s /etc/nginx/sites-available/emefa /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL certificate
certbot --nginx -d emefa.ai -d www.emefa.ai --non-interactive --agree-tos -m admin@emefa.ai
```

#### Step 5: Database Setup

```bash
# Using managed database (recommended)
# 1. Create PostgreSQL instance on AWS RDS / DigitalOcean / etc.
# 2. Update DATABASE_URL in .env
# 3. Run migrations

docker-compose exec backend alembic upgrade head

# Or self-hosted PostgreSQL
docker-compose -f docker-compose.prod.yml up postgres -d
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE emefa_prod;"
```

#### Step 6: Health Checks

```bash
# Check backend
curl https://emefa.ai/health

# Check database connection
curl https://emefa.ai/health/db

# Check Redis
curl https://emefa.ai/health/redis

# Check integrations
curl https://emefa.ai/health/integrations
```

---

## 📊 Production Checklist

### Security
- [ ] SSL/TLS certificate configured
- [ ] Firewall rules in place
- [ ] Database backups enabled
- [ ] Secrets encrypted (not in git)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] HTTPS enforced

### Performance
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Redis caching enabled
- [ ] Static files on CDN
- [ ] Load balancer configured
- [ ] Monitoring set up

### Monitoring & Logging
- [ ] Structured logging configured
- [ ] Error tracking (Sentry) enabled
- [ ] Performance monitoring (Datadog/NewRelic)
- [ ] Alerts configured
- [ ] Log aggregation (ELK/Loki)
- [ ] Uptime monitoring

### Compliance
- [ ] GDPR compliance checked
- [ ] Data retention policy set
- [ ] Audit logging enabled
- [ ] API rate limits set
- [ ] IP whitelisting (if needed)

### Backup & Recovery
- [ ] Database backups daily
- [ ] Secrets backed up securely
- [ ] Recovery procedure tested
- [ ] Rollback procedure documented

---

## 🔧 Docker Compose Configuration

### docker-compose.prod.yml

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: emefa_prod
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_USER: ${DB_USER}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $DB_USER"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - emefa_network
    restart: always

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - emefa_network
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=False
      - LOG_LEVEL=INFO
      - WORKER_PROCESSES=4
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/config:/app/config
    ports:
      - "8000:8000"
    networks:
      - emefa_network
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:

networks:
  emefa_network:
    driver: bridge
```

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run migrations and start server
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4"]
```

---

## 🔄 CI/CD Pipeline (GitHub Actions)

### .github/workflows/deploy.yml

```yaml
name: Deploy EMEFA

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt -r requirements-dev.txt
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost/test
          REDIS_URL: redis://localhost:6379/0
        run: |
          cd backend
          pytest --cov=app tests/
      
      - name: Lint code
        run: |
          cd backend
          flake8 app tests
          black --check app tests

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/emefa:latest
          cache-from: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/emefa:buildcache
          cache-to: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/emefa:buildcache,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh -i ~/.ssh/deploy_key $DEPLOY_HOST << 'EOF'
          cd /var/www/emefa
          git pull origin main
          docker-compose -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.prod.yml up -d
          docker-compose exec -T backend alembic upgrade head
          EOF
```

---

## 📈 Scaling for Growth

### Load Balancing
```
              CloudFlare / Route53
                    │
         ┌──────────┼──────────┐
         │          │          │
    [Nginx 1]  [Nginx 2]  [Nginx 3]
         │          │          │
         └──────────┼──────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
    [App 1]     [App 2]     [App N]
         │          │          │
         └──────────┼──────────┘
                    │
          PostgreSQL (Primary-Replica)
                 + Redis Cluster
```

### Horizontal Scaling
```bash
# Increase app instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Or use Kubernetes:
kubectl scale deployment emefa-backend --replicas=3
```

---

## 🔐 Security Hardening

### Environment Variables
```bash
# Store in secure secret manager
# AWS Secrets Manager, Vault, 1Password, etc.
# Never commit .env to git
```

### Database Security
```sql
-- Create separate user for app
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE emefa_prod TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Enable encryption at rest (AWS RDS)
-- Enable backups
-- Enable SSL for connections
```

### API Security
```python
# Rate limiting (already configured)
# CORS (whitelist domains)
# JWT validation
# Input validation
# SQL injection prevention (SQLAlchemy ORM)
```

---

## 📊 Monitoring Setup

### Health Checks
```bash
# Automatic health checks
GET /health                # Basic health
GET /health/db            # Database connectivity
GET /health/redis         # Redis connectivity
GET /health/integrations  # Integration status
```

### Logging
```python
# Structured JSON logging
# ELK Stack / Loki / CloudWatch
# Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
```

### Metrics
```
# Prometheus metrics at /metrics
# Track: requests/sec, response time, errors, DB pool, cache hit rate
```

---

## 🐛 Rollback Procedure

```bash
# If deployment fails
git revert <commit>
git push origin main

# Or manual rollback
docker-compose pull previous_version
docker-compose up -d

# Check health
curl https://emefa.ai/health
```

---

## 📞 Support

**Issues?** Check:
1. Logs: `docker-compose logs backend`
2. Health: `curl https://emefa.ai/health`
3. Database: `docker-compose exec postgres psql -U emefa_prod`
4. Redis: `docker-compose exec redis redis-cli`

---

**Deployment Complete!** 🎉

Your EMEFA platform is now running in production.

Next steps:
1. Configure domain DNS
2. Setup monitoring alerts
3. Create backup schedule
4. Test disaster recovery
5. Launch public beta
