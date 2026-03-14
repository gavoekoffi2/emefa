# ✨ EMEFA — Plateforme SaaS d'Assistants IA Africaine

> Créez et déployez des assistants IA personnalisés connectés à vos données.
> Chat, voix, WhatsApp, Telegram — en quelques minutes.

![Version](https://img.shields.io/badge/version-0.2.0-blue)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Status](https://img.shields.io/badge/status-Production%20Ready-green)

---

## 🚀 Qu'est-ce que EMEFA?

EMEFA est une **plateforme SaaS révolutionnaire** qui permet à chaque entreprise, entrepreneur ou particulier de créer **son propre assistant IA personnalisé**.

### Fonctionnalités Principales

- ✅ **Création d'assistants en 5 minutes** — Templates métiers ou création libre
- ✅ **Multi-canal** — Web, WhatsApp, Telegram, Email, SMS, Voix (LiveKit)
- ✅ **Skills Marketplace** — Bibliothèque de compétences réutilisables
- ✅ **Knowledge Base** — Indexation vectorielle + recherche hybride
- ✅ **Apprentissage continu** — L'assistant apprend de chaque interaction
- ✅ **Paiements Africains** — Paystack, M-Pesa, Wave, Orange Money
- ✅ **Sécurisé** — Propulsé par OpenClaw (runtime IA sécurisé)

### Assistants Pré-conçus

| Métier | Description |
|--------|-------------|
| 🏗️ Architecte | Gestion de projets, devis, suivi clients |
| 📊 Comptable | Factures, rapports financiers, réconciliation |
| 💼 Commercial | Prospection, suivi ventes, CRM |
| 🎬 Créateur de Contenu | Génération sociale, scheduling |
| 🎧 Support Client | FAQ, tickets, assistance 24/7 |
| 🛒 E-commerce | Commandes, inventaire, recommandations |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                  FRONTEND                    │
│           (Next.js 15 + React 19)           │
│    Landing · Dashboard · Chat · Marketplace  │
├─────────────────────────────────────────────┤
│                 BACKEND                      │
│              (FastAPI + Python)              │
│   Auth · Assistants · Chat · Skills · RAG   │
├──────┬──────┬──────┬──────┬────────────────┤
│  DB  │Redis │Qdrant│MinIO │   IronClaw     │
│(PG16)│      │      │ (S3) │  (Agent RT)    │
└──────┴──────┴──────┴──────┴────────────────┘
```

### Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 15, React 19, Tailwind CSS, Radix UI |
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic |
| Database | PostgreSQL 16 (pgvector) |
| Cache | Redis 7 |
| Vector DB | Qdrant |
| Storage | MinIO (S3-compatible) |
| LLM | OpenRouter, OpenAI, Anthropic, Ollama |
| Agent Runtime | IronClaw (Rust, WASM sandbox) |
| Voice | LiveKit |
| Proxy | Nginx |

---

## 🚀 Installation Rapide

### Prérequis
- Docker + Docker Compose
- Git

### 1. Cloner le repo

```bash
git clone https://github.com/gavoekoffi2/emefa.git
cd emefa
```

### 2. Setup initial

```bash
bash scripts/setup.sh
```

### 3. Configurer

```bash
# Éditez .env avec votre clé OpenRouter et votre domaine
nano .env
```

### 4. Déployer

```bash
bash scripts/deploy.sh
```

### 5. Accéder

- **Frontend:** https://localhost
- **API:** https://localhost/api/v1
- **Docs:** https://localhost/docs

---

## 📦 Skills Marketplace

EMEFA dispose d'un marketplace de skills intégrés:

### Skills Officiels (10)

| Skill | Catégorie | Description |
|-------|-----------|-------------|
| WhatsApp Integration | Integration | Communication WhatsApp Business |
| Telegram Integration | Integration | Bots Telegram automatisés |
| Google Sheets | Integration | Lecture/écriture Google Sheets |
| SMS Automation | Communication | SMS via Africas Talking/Twilio |
| Payment Processing | Payment | Paystack, M-Pesa, Wave |
| Email Automation | Communication | SMTP automatisé |
| FAQ & Knowledge Base | Knowledge | Auto-learning FAQ |
| Web Research | Automation | Recherche internet temps réel |
| Content Generation | Automation | Contenu réseaux sociaux |
| Prospection | Automation | Lead generation automatisée |

### Créer vos propres skills

Consultez le [Guide Skills](docs/SKILLS_GUIDE.md).

---

## 🌍 Fait en Afrique, pour l'Afrique

EMEFA est conçu pour le marché africain avec:

- 💰 **Paiements locaux** — Paystack, M-Pesa, Wave, Orange Money
- 📱 **WhatsApp-first** — Le canal #1 en Afrique
- 📡 **SMS fallback** — Pour les zones à faible connectivité
- 🗣️ **Multi-langues** — Français, Anglais, et plus
- ⚡ **Léger** — Optimisé pour les connexions lentes

---

## 📚 Documentation

- [Guide d'installation](docs/INSTALL.md)
- [Documentation API](docs/API.md)
- [Guide des Skills](docs/SKILLS_GUIDE.md)
- [Guide des Intégrations](docs/INTEGRATIONS.md)
- [Architecture](ARCHITECTURE.md)
- [Sécurité](docs/SECURITY.md)
- [Déploiement](DEPLOYMENT.md)

---

## 🛠️ Développement

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

---

## 📄 Licence

Propriétaire — © 2026 Claude Gavoe / EMEFA. Tous droits réservés.

---

**Fait avec ❤️ à Lomé, Togo 🇹🇬**
