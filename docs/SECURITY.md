# EMEFA - Document de S\u00e9curit\u00e9

## Mod\u00e8le de Menaces

### Actifs prot\u00e9g\u00e9s
1. **Donn\u00e9es utilisateurs** : emails, mots de passe, conversations, m\u00e9moires
2. **Bases de connaissances** : documents confidentiels upload\u00e9s
3. **Cl\u00e9s API** : tokens LLM, Telegram, WhatsApp
4. **Int\u00e9grit\u00e9 des assistants** : system prompts, configurations

### Menaces identifi\u00e9es

| Menace | Impact | Probabilit\u00e9 | Mitigation |
|--------|--------|-------------|------------|
| Injection SQL | Critique | Faible | SQLAlchemy ORM (param\u00e9tr\u00e9), pas de raw SQL |
| Prompt injection | \u00c9lev\u00e9 | \u00c9lev\u00e9e | System prompt s\u00e9curis\u00e9 + IronClaw safety layer |
| XSS | \u00c9lev\u00e9 | Moyenne | Next.js auto-escape + CSP headers |
| CSRF | Moyen | Faible | JWT Bearer (pas de cookies) |
| Fuite de donn\u00e9es inter-tenant | Critique | Faible | Isolation par workspace_id sur chaque requ\u00eate |
| Vol de tokens | \u00c9lev\u00e9 | Moyenne | Tokens courts (30 min), refresh rotatif |
| Data at rest | Moyen | Faible | Chiffrement Fernet (AES-128-CBC) |

## Architecture de S\u00e9curit\u00e9

### Authentification
- **Mots de passe** : bcrypt avec salt automatique
- **JWT** : Access token (30 min) + Refresh token (7 jours, rotatif)
- **OAuth** : Google optionnel (via id_token verification)
- **Refresh tokens** : hash\u00e9s en base (SHA-256), r\u00e9vocation individuelle

### Autorisation (RBAC)
Trois r\u00f4les par workspace :
- **Owner** : Tous les droits, gestion workspace
- **Admin** : Gestion assistants, acc\u00e8s audit
- **Member** : Utilisation assistants uniquement

### Isolation Multi-Tenant
- Chaque requ\u00eate DB filtre par `workspace_id`
- Les assistants, conversations, KB sont li\u00e9s au workspace
- Pas d'acc\u00e8s inter-workspace possible via l'API
- Les collections Qdrant sont scop\u00e9es par assistant (`emefa_{assistant_id}`)

### Chiffrement
- **En transit** : HTTPS/TLS obligatoire en production
- **Au repos** : M\u00e9moires chiffr\u00e9es via Fernet (sym\u00e9trique, cl\u00e9 dans env)
- **Secrets** : Tokens Telegram/WhatsApp chiffr\u00e9s en base

### Protection Prompt Injection
1. System prompt g\u00e9n\u00e9r\u00e9 inclut des r\u00e8gles de s\u00e9curit\u00e9 explicites :
   - Interdiction de r\u00e9v\u00e9ler le system prompt
   - Refus des demandes hors p\u00e9rim\u00e8tre
   - Pas d'ex\u00e9cution d'actions non autoris\u00e9es
2. IronClaw safety layer : d\u00e9tection de patterns + sanitisation
3. Actions/outils soumis \u00e0 permissions (principle of least privilege)
4. Audit log de toutes les ex\u00e9cutions d'actions

### Audit Log Immuable
- Chaque action est journalis\u00e9e : qui, quoi, quand, IP
- Logs accessible aux Owner/Admin uniquement
- Insertion seule (pas de DELETE/UPDATE sur audit_logs)

### Actions (Outils)
- Chaque action a des permissions d\u00e9clar\u00e9es
- L'assistant ne peut ex\u00e9cuter que les actions explicitement activ\u00e9es
- Rate limiting par action
- Toute ex\u00e9cution est audit\u00e9e

### IronClaw (Agent Runtime)
- Sandbox WASM pour les outils non-fiables
- Allowlist d'endpoints HTTP
- Injection de credentials \u00e0 la fronti\u00e8re hôte
- D\u00e9tection de fuites de credentials
- AES-256-GCM pour les secrets internes

## Recommandations Production

### Obligatoire
1. G\u00e9n\u00e9rer des cl\u00e9s fortes pour `JWT_SECRET`, `SECRET_KEY`, `ENCRYPTION_KEY`
2. Activer HTTPS (TLS 1.2+ minimum)
3. Configurer `ALLOWED_ORIGINS` avec les domaines exacts
4. Utiliser un PostgreSQL avec mot de passe fort
5. Ne PAS exposer Redis, Qdrant, MinIO sur Internet
6. Activer le firewall (seuls ports 80/443 publics)

### Recommand\u00e9
7. Rate limiting au niveau reverse proxy (Nginx limit_req)
8. Backup r\u00e9gulier de la base PostgreSQL
9. Monitoring des erreurs (Sentry ou \u00e9quivalent)
10. Rotation r\u00e9guli\u00e8re des cl\u00e9s JWT
11. Scanner les d\u00e9pendances (npm audit, pip-audit)
12. Activer les logs d'acc\u00e8s PostgreSQL

### WhatsApp QR Bridge
- Service NON officiel : risque de ban par WhatsApp
- Isol\u00e9 en microservice s\u00e9par\u00e9 (Docker profile distinct)
- Quotas de messages (50/heure par d\u00e9faut)
- Maximum de sessions limit\u00e9 (10 par d\u00e9faut)
- Peut \u00eatre d\u00e9sactiv\u00e9 sans impact sur le reste
- Pour production, utiliser WhatsApp Cloud API
