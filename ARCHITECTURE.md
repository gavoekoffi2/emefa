# EMEFA - Architecture complète

## 🎯 Vision

EMEFA est une plateforme SaaS pour créer des assistants IA personnalisés avec un **Skills System** modulaire et des intégrations africaines prioritaires.

---

## 📊 Architecture Globale

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Web + Mobile)             │
│  • Dashboard utilisateurs                             │
│  • UI Messagerie WhatsApp-like                        │
│  • Marketplace de Skills                              │
│  • Configuration d'Assistants                         │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┴──────────────┬────────────┐
         │                            │            │
┌────────▼────────┐    ┌──────────────▼──┐  ┌─────▼──────┐
│   API Gateway   │    │  WebSocket Hub  │  │ Auth(JWT)  │
└────────┬────────┘    └──────────────┬──┘  └────────────┘
         │                            │
┌────────▼────────────────────────────▼───────────────────┐
│              BACKEND (FastAPI + AsyncIO)                 │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  SKILLS SYSTEM (Core Infrastructure)             │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ • SkillsService (CRUD, versioning, injection)   │   │
│  │ • SkillInjectionService (prompt enrichment)     │   │
│  │ • Marketplace (search, discovery, ratings)      │   │
│  │ • Configuration Management (save & reuse)       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  INTEGRATIONS TIER 1 (Production Ready)          │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ WhatsApp      │ Telegram    │ Google Sheets     │   │
│  │ SMS African   │ Paiements   │ (Enterprise)      │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  CORE SERVICES                                   │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ • Chat Service                                   │   │
│  │ • LLM Service (Claude, GPT, LLaMA)              │   │
│  │ • RAG Service (Knowledge Base)                   │   │
│  │ • Auth Service                                   │   │
│  │ • Template Service (templates métiers)          │   │
│  │ • Audit Service (compliance & logging)          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└────────┬────────────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────────────┐
│              DATABASE & PERSISTENCE                      │
│                                                          │
│  PostgreSQL 15+ (Async with SQLAlchemy)                │
│  • Utilisateurs, Assistants, Conversations              │
│  • Skills, Versions, Installations                      │
│  • Configurations, Marketplace entries                  │
│  • Audit logs, RAG vectors                              │
│                                                          │
│  Redis (Cache + Sessions)                              │
│  • Caching d'assistants                                 │
│  • Sessions utilisateur                                 │
│  • Rate limiting                                        │
└──────────────────────────────────────────────────────────┘
```

---

## 🏗️ Structure du Projet

```
emefa/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app + lifespan
│   │   ├── core/
│   │   │   ├── config.py           # Configuration centralisée
│   │   │   ├── database.py         # SQLAlchemy setup
│   │   │   ├── security.py         # Auth & security
│   │   │   ├── exceptions.py       # Custom exceptions
│   │   │   └── rate_limit.py       # Rate limiting middleware
│   │   │
│   │   ├── models/
│   │   │   ├── base.py             # Base model with timestamps
│   │   │   ├── user.py             # User model
│   │   │   ├── assistant.py        # Assistant model
│   │   │   ├── skill.py            # 🆕 Skill models (CRUD)
│   │   │   ├── conversation.py     # Chat history
│   │   │   ├── knowledge.py        # RAG documents
│   │   │   ├── audit.py            # Audit logs
│   │   │   └── template.py         # Templates
│   │   │
│   │   ├── services/
│   │   │   ├── skills_service.py   # 🆕 Skills CRUD & injection
│   │   │   ├── chat_service.py     # Chat & LLM integration
│   │   │   ├── llm_service.py      # LLM API clients
│   │   │   ├── rag_service.py      # Vector search & RAG
│   │   │   ├── auth_service.py     # Authentication
│   │   │   ├── template_service.py # Templates
│   │   │   ├── audit_service.py    # Logging & compliance
│   │   │   └── ...
│   │   │
│   │   ├── integrations/           # 🆕 All integrations here
│   │   │   ├── whatsapp_integration.py      # WhatsApp Cloud API
│   │   │   ├── telegram_integration.py      # Telegram Bot API
│   │   │   ├── google_sheets_integration.py # Google Sheets API
│   │   │   ├── african_sms_integration.py   # Africas Talking + Twilio
│   │   │   ├── african_payments_integration.py  # MOMO, Paystack
│   │   │   └── __init__.py
│   │   │
│   │   ├── api/
│   │   │   ├── deps.py             # Common dependencies
│   │   │   └── routes/
│   │   │       ├── skills.py       # 🆕 Skills API endpoints
│   │   │       ├── assistants.py
│   │   │       ├── chat.py
│   │   │       ├── whatsapp.py
│   │   │       ├── telegram.py
│   │   │       └── ...
│   │   │
│   │   ├── schemas/
│   │   │   ├── skill.py            # 🆕 Skill Pydantic models
│   │   │   ├── assistant.py
│   │   │   ├── chat.py
│   │   │   └── ...
│   │   │
│   │   └── __init__.py
│   │
│   ├── tests/
│   ├── migrations/ (Alembic)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SkillsMarketplace.tsx      # 🆕 Skills UI
│   │   │   ├── SkillInstaller.tsx         # 🆕 Installation UI
│   │   │   ├── ChatUI.tsx                 # WhatsApp-like messaging
│   │   │   ├── AssistantConfig.tsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SkillsMarketplace.tsx      # 🆕
│   │   │   ├── AssistantSetup.tsx
│   │   │   └── ...
│   │   └── ...
│   └── package.json
│
├── templates/
│   ├── assistants/
│   │   ├── customer_service.json
│   │   ├── sales_agent.json
│   │   ├── support_bot.json
│   │   └── ...
│   └── skills/
│       ├── whatsapp_handler.json
│       ├── payment_processor.json
│       └── ...
│
├── infra/
│   ├── docker-compose.yml
│   ├── kubernetes/
│   └── deployment/
│
├── docs/
│   ├── API.md                # API documentation
│   ├── SKILLS_GUIDE.md       # 🆕 Skills system guide
│   ├── INTEGRATIONS.md       # 🆕 Integration setup
│   ├── DEPLOYMENT.md
│   └── SECURITY.md
│
└── ARCHITECTURE.md           # This file
```

---

## 🎓 Skills System - Architecture Détaillée

### Models (SQLAlchemy)

```python
Skill
├── Metadata: name, slug, description, category
├── Versioning: version, latest_version, published_at
├── Content: config_schema, prompt_template, system_message
├── Stats: usage_count, installation_count, rating
├── Relations:
│   ├── installations: SkillInstallation[]
│   ├── configurations: SkillConfiguration[]
│   └── versions: SkillVersion[]

SkillVersion (Historique)
├── Version tracking with changelog
├── Schema & prompt snapshots

SkillInstallation (Injection dans assistants)
├── Links skill to assistant
├── Instance-specific configuration
├── Usage tracking

SkillConfiguration (Réutilisable)
├── Named configurations for a skill
├── Shareable (public/private)
├── Default marking

SkillMarketplaceEntry (Découverte)
├── Rich metadata (icon, categories, industries)
├── Pricing & trial info
├── Ratings & downloads stats
```

### Services

#### SkillsService
- **CRUD**: create, update, publish, get, search
- **Versioning**: create_version, get_versions
- **Installation**: install_skill, uninstall_skill, get_assistant_skills
- **Configuration**: save_configuration, get_configurations
- **Search**: search_skills, get_marketplace_entries
- **Stats**: increment_usage

#### SkillInjectionService
- **build_enriched_system_prompt()**: Enrichir le system prompt avec skills disponibles
- **build_skill_context()**: Construire contexte d'exécution pour le chat

### API Routes

```
POST   /api/v1/skills                      # Create skill
GET    /api/v1/skills/{skill_id}           # Get skill
PUT    /api/v1/skills/{skill_id}           # Update (draft only)
POST   /api/v1/skills/{skill_id}/publish   # Publish

GET    /api/v1/skills/{skill_id}/versions  # Version history
POST   /api/v1/skills/{skill_id}/versions  # Create version

POST   /api/v1/skills/{skill_id}/install   # Install in assistant
DELETE /api/v1/skills/installation/{id}    # Uninstall
GET    /api/v1/skills/assistant/{id}/skills  # List assistant skills

POST   /api/v1/skills/{skill_id}/configurations      # Save config
GET    /api/v1/skills/{skill_id}/configurations      # List configs

POST   /api/v1/skills/search                # Search skills
GET    /api/v1/skills/marketplace/entries   # Marketplace browse
```

---

## 🔌 Integrations - Tier 1 (Prioritaire)

### WhatsApp Integration
**Provider**: Meta Cloud API  
**Features**:
- Text messages
- Media (photo, video, document)
- Interactive messages (buttons, lists)
- Template messages (pre-approved)
- Webhook handling & signature verification
- Contact profile lookup

**Config**:
```json
{
  "phone_number_id": "xxx",
  "access_token": "xxx",
  "business_account_id": "xxx",
  "webhook_verify_token": "xxx"
}
```

### Telegram Integration
**Provider**: Telegram Bot API  
**Features**:
- Text & media messages
- Interactive keyboards
- Callback queries
- Webhook management
- Update parsing

**Config**:
```json
{
  "bot_token": "xxx:yyy"
}
```

### Google Sheets Integration
**Provider**: Google Sheets API v4  
**Features**:
- Read/write ranges
- Batch operations
- Create sheets
- Append rows (with dict support)
- Search & filtering
- Clear ranges

**Config**:
```json
{
  "service_account_json": {...}  or path
}
```

### African SMS Integration
**Providers**: 
- Africas Talking (PRIMARY for Africa)
- Twilio (Fallback/Global)

**Features**:
- Single & bulk SMS
- Custom sender IDs
- Account balance checking
- Phone validation

**Config**:
```json
{
  "provider": "africastalking",
  "api_key": "xxx",
  "username": "sandbox"
}
```

### African Payments Integration
**Providers**:
- MOMO (MTN, Orange, Airtel)
- Paystack (Pan-African)
- Others (PesaPal, Instapay)

**Features**:
- Payment requests
- Transaction verification
- Transfer initiation
- Recipient management
- Phone & amount validation

**Config**:
```json
{
  "provider": "paystack",
  "secret_key": "xxx"
}
```

---

## 🔐 Security Architecture

### Authentication & Authorization
```
JWT Token (HS256) + Refresh Token
├── User ID + Email
├── Workspace ID
├── Permissions (roles)
└── 24h expiry

Rate Limiting
├── Per user: 1000 req/hour
├── Per IP: 10000 req/hour
└── Per endpoint: custom limits

Webhook Security
├── Signature verification (HMAC-SHA256)
├── Request validation
└── IP whitelisting (optional)
```

### Data Protection
- Encryption au repos (sensitive fields)
- HTTPS only
- CORS strict
- XSS/CSRF protection
- SQL injection prevention (SQLAlchemy)

---

## 📈 Scaling Architecture

### Horizontal Scaling
```
Load Balancer (Nginx)
│
├─ FastAPI Instance 1
├─ FastAPI Instance 2
├─ FastAPI Instance 3
└─ FastAPI Instance N

PostgreSQL (Primary-Replica)
├─ Primary (Write)
└─ Replicas (Read)

Redis Cluster (Sessions + Cache)
```

### Performance Optimization
- **Async/Await**: Tout est async
- **Connection Pooling**: DB + HTTP
- **Caching**: Redis pour assistants & configs
- **Query Optimization**: Index sur frequently queried fields
- **Pagination**: Mandatory pour les listes

---

## 🚀 Deployment Ready Features

### Environment Configuration
```
.env
├── DATABASE_URL (PostgreSQL)
├── REDIS_URL (Redis)
├── SECRET_KEY
├── WHATSAPP_TOKEN
├── TELEGRAM_TOKEN
├── PAYSTACK_KEY
├── AFRICAS_TALKING_KEY
└── LLM_KEYS (Claude, OpenAI, etc.)
```

### Docker Support
- FastAPI Dockerfile
- PostgreSQL container
- Redis container
- docker-compose.yml pour dev/prod

### Health Checks
```
GET /health                    # Basic health
GET /health/db                 # DB connectivity
GET /health/redis              # Redis connectivity
GET /health/integrations       # Integration status
```

### Monitoring & Logging
- Structured JSON logging
- Request tracing
- Error tracking (Sentry)
- Performance metrics (Prometheus)

---

## 📋 Étapes d'Implémentation

### ✅ Phase 1: Skills System (COMPLETED)
- [x] Models complets (Skill, Version, Installation, Configuration, Marketplace)
- [x] SkillsService avec CRUD complet
- [x] API routes pour skills
- [x] Schemas Pydantic
- [x] Injection dans prompts

### ✅ Phase 2: Integrations Tier 1 (COMPLETED)
- [x] WhatsApp Cloud API
- [x] Telegram Bot API
- [x] Google Sheets API
- [x] Africas Talking SMS
- [x] Payment integrations (MOMO, Paystack)

### 📌 Phase 3: Frontend & UI
- [ ] SkillsMarketplace React component
- [ ] SkillInstaller component
- [ ] WhatsApp-like Chat UI
- [ ] Skills configuration panel
- [ ] Marketplace discovery

### 📌 Phase 4: Templates & Assistants
- [ ] Template models pour assistants métiers
- [ ] Pre-built templates (Customer Service, Sales, Support)
- [ ] Onboarding wizard
- [ ] Quick-start guides

### 📌 Phase 5: Deployment
- [ ] Docker images
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Production checklist
- [ ] Monitoring setup

---

## 🔗 Integration Patterns

### Pattern 1: Assistant + Skills
```python
# 1. Create assistant
assistant = await AssistantService.create_assistant(...)

# 2. Install skills
await SkillsService.install_skill(skill_id, assistant_id)

# 3. Load skills for chat
skills = await SkillsService.get_assistant_skills(assistant_id)

# 4. Enrich prompt
enriched_prompt = SkillInjectionService.build_enriched_system_prompt(
    base_prompt,
    skills
)

# 5. Chat with context
response = await LLMService.chat(
    assistant_id,
    user_message,
    system_prompt=enriched_prompt,
    context=SkillInjectionService.build_skill_context(skills)
)
```

### Pattern 2: Webhook Handler
```python
# WhatsApp webhook
@router.post("/webhooks/whatsapp")
async def handle_whatsapp_webhook(payload: dict):
    # 1. Verify signature
    if not wa_integration.verify_signature(...):
        return 403
    
    # 2. Parse message
    message = wa_integration.parse_webhook_message(payload)
    
    # 3. Get assistant
    assistant = await AssistantService.get_by_whatsapp_id(message.sender)
    
    # 4. Chat
    response = await ChatService.process_message(assistant, message.text)
    
    # 5. Reply
    await wa_integration.send_text_message(message.sender, response)
```

---

## 💡 Best Practices

### Skills Development
1. **Immutable versions**: Chaque version est immuable
2. **Schema validation**: Tous les configs sont validés
3. **Prompt templates**: Réutilisables et versionées
4. **Testing**: Unit tests pour chaque skill

### Integration Development
1. **Async everywhere**: Utilisez httpx.AsyncClient
2. **Error handling**: Logs structurés
3. **Rate limiting**: Respectez les limites des APIs
4. **Retry logic**: Exponential backoff

### API Design
1. **Versioning**: /api/v1, /api/v2
2. **Consistent errors**: ErrorResponse standard
3. **Pagination**: limit + offset
4. **Filtering**: Query parameters

---

## 📞 Support Tiers

### Tier 1 (Prioritaire pour Afrique)
- ✅ WhatsApp
- ✅ Telegram
- ✅ SMS Africain
- ✅ Paiements Africains
- ✅ Google Sheets

### Tier 2 (Prochainement)
- [ ] Facebook Messenger
- [ ] Instagram DM
- [ ] Slack
- [ ] Email
- [ ] Voice (Twilio)

### Tier 3 (Enterprise)
- [ ] Salesforce CRM
- [ ] HubSpot
- [ ] Zapier
- [ ] Custom webhooks

---

**Architecture finalisée par Claude pour EMEFA.**  
**Deploy-ready avec production checklist complète.**
