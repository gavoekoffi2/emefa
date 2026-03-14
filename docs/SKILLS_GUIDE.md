# EMEFA Skills System - Guide Complet

## 📚 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Concepts clés](#concepts-clés)
3. [Créer un skill](#créer-un-skill)
4. [Installer & Utiliser](#installer--utiliser)
5. [Marketplace](#marketplace)
6. [Bonnes pratiques](#bonnes-pratiques)
7. [Exemples](#exemples)

---

## Vue d'ensemble

Le **Skills System** dans EMEFA permet de:
- ✅ Créer des compétences réutilisables
- ✅ Versionner et itérer rapidement
- ✅ Installer dans n'importe quel assistant
- ✅ Enrichir les capacités des assistants
- ✅ Partager sur le marketplace
- ✅ Monétiser vos skills (dans le futur)

### Architecture Simplifiée

```
┌─────────────────────────────────────┐
│  Skill Creator                      │
│  (Vous développez un skill)         │
└────────────────┬────────────────────┘
                 │
         ┌───────▼────────┐
         │ Skill Instance │  (modèles, versions)
         └───────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
┌───▼──┐   ┌────▼───┐   ┌───▼──────┐
│Draft │   │Published│   │Deprecated│
└──────┘   └─────────┘   └──────────┘
              │
         ┌────▼──────────┐
         │ Marketplace   │
         │ (Découverte)  │
         └───────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼────────┐    ┌─────▼──────┐
│ Assistant1 │    │ Assistant2 │
│ (Install1) │    │ (Install2) │
└────────────┘    └────────────┘
```

---

## Concepts clés

### 1. Skill
Une **compétence réutilisable** que vous créez et versionnez.

```python
{
  "id": "skill_123",
  "name": "WhatsApp Handler",
  "slug": "whatsapp-handler",
  "category": "integration",
  "description": "Gère les messages WhatsApp entrants",
  "version": "1.0.0",
  "status": "published",
  "config_schema": {
    "type": "object",
    "properties": {
      "webhook_url": {"type": "string"},
      "api_key": {"type": "string"}
    }
  },
  "system_message": "Tu es un assistant WhatsApp...",
  "prompt_template": "Réponds au message: {message}",
  "usage_count": 150,
  "installation_count": 5
}
```

### 2. Installation
Une **instance d'un skill dans un assistant**.

```python
{
  "installation_id": "inst_456",
  "skill_id": "skill_123",
  "assistant_id": "asst_789",
  "configuration": {
    "webhook_url": "https://...",
    "api_key": "sk_..."
  },
  "is_active": True,
  "usage_count": 42
}
```

### 3. Configuration Sauvegardée
Une **preset de configuration réutilisable**.

```python
{
  "id": "config_abc",
  "skill_id": "skill_123",
  "name": "Config Prod",
  "config": {
    "webhook_url": "https://prod.example.com",
    "api_key": "sk_prod_..."
  },
  "is_default": True,
  "is_public": False
}
```

### 4. Catégories
Les skills sont organisés par catégorie:

- **integration**: Connexions externes (WhatsApp, Telegram, etc.)
- **automation**: Automatisation de processus
- **analytics**: Analyse de données
- **communication**: Gestion des communications
- **payment**: Paiements & transactions
- **knowledge**: Gestion des connaissances
- **custom**: Custom business logic

---

## Créer un skill

### Étape 1: Définir votre skill

```bash
POST /api/v1/skills
```

```json
{
  "name": "Customer Feedback Analyzer",
  "slug": "customer-feedback-analyzer",
  "description": "Analyse les feedback clients et génère des insights",
  "category": "analytics",
  "tags": ["analytics", "customer-service", "ai"],
  "is_public": false,
  "config_schema": {
    "type": "object",
    "properties": {
      "sentiment_model": {
        "type": "string",
        "enum": ["distilbert", "roberta"]
      },
      "language": {
        "type": "string",
        "default": "en"
      }
    },
    "required": ["sentiment_model"]
  },
  "system_message": "Tu es un expert en analyse de feedback client...",
  "prompt_template": "Analyze this feedback: {feedback}\\nProvide: 1. Sentiment, 2. Key issues, 3. Recommendations"
}
```

### Étape 2: Itérer en mode draft

```bash
PUT /api/v1/skills/{skill_id}
```

```json
{
  "description": "Version 2 of the analyzer",
  "prompt_template": "New improved template..."
}
```

### Étape 3: Créer des versions

```bash
POST /api/v1/skills/{skill_id}/versions?version=0.1.0&changelog=Initial release
```

### Étape 4: Publier

```bash
POST /api/v1/skills/{skill_id}/publish
```

---

## Installer & Utiliser

### Installer dans un assistant

```bash
POST /api/v1/skills/{skill_id}/install
```

```json
{
  "assistant_id": "asst_123",
  "configuration": {
    "sentiment_model": "roberta",
    "language": "fr"
  }
}
```

### Récupérer les skills d'un assistant

```bash
GET /api/v1/skills/assistant/{assistant_id}/skills
```

Response:
```json
{
  "skills": [
    {
      "installation_id": "inst_789",
      "skill_id": "skill_123",
      "name": "Customer Feedback Analyzer",
      "slug": "customer-feedback-analyzer",
      "description": "...",
      "category": "analytics",
      "config": {
        "sentiment_model": "roberta",
        "language": "fr"
      },
      "system_message": "Tu es un expert...",
      "prompt_template": "Analyze this feedback: ..."
    }
  ]
}
```

### Utiliser dans le chat

Le service de chat enrichit automatiquement le system prompt avec les skills disponibles:

```python
# Backend code
skills = await SkillsService.get_assistant_skills(assistant_id)
enriched_prompt = SkillInjectionService.build_enriched_system_prompt(
    base_system_prompt,
    skills
)

# The assistant now knows about all installed skills
response = await LLMService.chat(
    assistant_id,
    user_message,
    system_prompt=enriched_prompt
)
```

---

## Marketplace

### Créer une entrée marketplace

```bash
POST /api/v1/skills/marketplace/entries
```

```json
{
  "skill_id": "skill_123",
  "title": "Customer Feedback Analyzer Pro",
  "short_description": "AI-powered feedback analysis in seconds",
  "long_description": "...",
  "icon_url": "https://...",
  "banner_url": "https://...",
  "categories": ["analytics", "customer-service"],
  "industries": ["retail", "ecommerce", "saas"],
  "use_cases": ["sentiment analysis", "issue detection", "nps tracking"],
  "is_free": false,
  "pricing_type": "subscription",
  "trial_available": true,
  "trial_days": 14
}
```

### Chercher des skills

```bash
POST /api/v1/skills/search
```

```json
{
  "query": "feedback",
  "category": "analytics",
  "tags": ["ai", "customer"],
  "limit": 20,
  "offset": 0
}
```

### Parcourir le marketplace

```bash
GET /api/v1/skills/marketplace/entries?category=integration&industry=retail&featured_only=false
```

---

## Bonnes pratiques

### 1. Schema Validation

**Toujours** définir un JSON Schema pour vos configs:

```json
{
  "config_schema": {
    "type": "object",
    "properties": {
      "api_key": {
        "type": "string",
        "description": "API key for authentication"
      },
      "timeout": {
        "type": "integer",
        "minimum": 1,
        "maximum": 300,
        "default": 30
      },
      "retry_count": {
        "type": "integer",
        "minimum": 0,
        "maximum": 5
      }
    },
    "required": ["api_key"],
    "additionalProperties": false
  }
}
```

### 2. Versioning Strategy

- **0.x.x**: Development/experimental
- **1.x.x**: Stable release
- **Breaking changes**: Major version bump
- **Features**: Minor version bump
- **Fixes**: Patch version bump

Example changelog:
```
v1.1.0 (2024-03-14)
- Added support for French language
- Improved sentiment accuracy by 5%
- Fixed memory leak in bulk processing

v1.0.2 (2024-03-10)
- Security patch for API key handling
- Bug fix for emoji parsing

v1.0.0 (2024-03-01)
- Initial release
```

### 3. Prompt Templates

Keep templates reusable with placeholders:

```
system_message: "Tu es un assistant de feedback. Sois concis et actionnable."

prompt_template: |
  Analyze this customer feedback:
  ---
  {feedback}
  ---
  
  Provide a JSON response with:
  - sentiment: positive|negative|neutral
  - score: 1-10
  - categories: [list of issue categories]
  - recommendations: [actionable suggestions]
```

### 4. Configuration Reuse

Save common configurations:

```bash
POST /api/v1/skills/{skill_id}/configurations
```

```json
{
  "name": "Production Setup",
  "description": "Optimized config for production use",
  "config": {
    "sentiment_model": "roberta",
    "language": "fr",
    "batch_size": 32,
    "cache_enabled": true
  },
  "is_default": true,
  "is_public": false
}
```

Then reuse:
```bash
POST /api/v1/skills/{skill_id}/install
{
  "assistant_id": "asst_456",
  "configuration": {"_use_saved_config": "config_id"}
}
```

### 5. Testing Skills

Before publishing:

1. **Config validation**: Test with invalid configs
2. **Edge cases**: Empty input, very long input, special chars
3. **Integration**: Test with real assistant
4. **Performance**: Measure response time
5. **Documentation**: Clear examples

---

## Exemples

### Exemple 1: WhatsApp Handler Skill

**Création:**
```json
{
  "name": "WhatsApp Handler",
  "slug": "whatsapp-handler",
  "category": "integration",
  "description": "Handles incoming WhatsApp messages and routes to assistants",
  "config_schema": {
    "type": "object",
    "properties": {
      "phone_number_id": {"type": "string"},
      "access_token": {"type": "string"},
      "webhook_url": {"type": "string"}
    },
    "required": ["phone_number_id", "access_token"]
  },
  "system_message": "You are a WhatsApp customer service assistant. Be helpful and friendly.",
  "prompt_template": "WhatsApp message from {sender_name}: {message_text}"
}
```

**Installation:**
```json
{
  "assistant_id": "asst_customer_service",
  "configuration": {
    "phone_number_id": "123456789",
    "access_token": "whatsapp_token_xxx",
    "webhook_url": "https://api.example.com/webhooks/whatsapp"
  }
}
```

### Exemple 2: Payment Processor Skill

**Création:**
```json
{
  "name": "Payment Processor",
  "slug": "payment-processor",
  "category": "payment",
  "description": "Process payments via Paystack and Mobile Money",
  "config_schema": {
    "type": "object",
    "properties": {
      "provider": {
        "type": "string",
        "enum": ["paystack", "momo"]
      },
      "api_key": {"type": "string"},
      "currency": {
        "type": "string",
        "default": "XOF"
      },
      "min_amount": {"type": "number", "default": 100},
      "max_amount": {"type": "number", "default": 1000000}
    },
    "required": ["provider", "api_key"]
  },
  "system_message": "You help users make secure payments. Always verify amounts before confirming.",
  "prompt_template": "User wants to pay {amount} {currency} via {provider}. Confirm the transaction details."
}
```

### Exemple 3: Analytics Dashboard Skill

**Création:**
```json
{
  "name": "Analytics Dashboard",
  "slug": "analytics-dashboard",
  "category": "analytics",
  "description": "Query and display conversation analytics",
  "config_schema": {
    "type": "object",
    "properties": {
      "google_sheets_id": {"type": "string"},
      "spreadsheet_name": {"type": "string"},
      "metrics": {
        "type": "array",
        "items": {"type": "string"}
      }
    },
    "required": ["google_sheets_id"]
  },
  "system_message": "You are an analytics expert. Help users understand conversation metrics.",
  "prompt_template": "Show analytics for: {metric_type}"
}
```

---

## API Reference Rapide

### Skills CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/skills` | Create skill |
| GET | `/api/v1/skills/{id}` | Get skill |
| PUT | `/api/v1/skills/{id}` | Update (draft only) |
| POST | `/api/v1/skills/{id}/publish` | Publish skill |
| DELETE | `/api/v1/skills/{id}` | Delete (author only) |

### Versioning

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/skills/{id}/versions` | Create version |
| GET | `/api/v1/skills/{id}/versions` | Get all versions |

### Installation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/skills/{id}/install` | Install in assistant |
| DELETE | `/api/v1/skills/installation/{id}` | Uninstall |
| GET | `/api/v1/skills/assistant/{id}/skills` | List assistant skills |

### Configurations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/skills/{id}/configurations` | Save config |
| GET | `/api/v1/skills/{id}/configurations` | List configs |

### Marketplace

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/skills/search` | Search skills |
| GET | `/api/v1/skills/marketplace/entries` | Browse marketplace |

---

## Prochaines étapes

1. ✅ **Créer votre premier skill** - Start with a simple one
2. 📦 **Publier sur le marketplace** - Share with others
3. 💰 **Monétiser (futur)** - Premium features coming soon
4. 🤝 **Collaborer** - Build with the community

---

**Questions?** Consultez `/docs/API.md` pour plus de détails.
