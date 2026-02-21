# EMEFA - Documentation API

Base URL: `http://localhost:8000/api/v1`

## Authentification

Toutes les routes prot\u00e9g\u00e9es n\u00e9cessitent le header :
```
Authorization: Bearer <access_token>
X-Workspace-ID: <workspace_uuid>  (optionnel, d\u00e9faut = premier workspace)
```

### POST /auth/register
Cr\u00e9er un compte + workspace.

```json
// Request
{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "Kofi Mensah",
  "workspace_name": "Mon Entreprise"
}

// Response 200
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### POST /auth/login
```json
// Request
{ "email": "user@example.com", "password": "securepass123" }

// Response 200
{ "access_token": "eyJ...", "refresh_token": "eyJ...", "token_type": "bearer" }
```

### POST /auth/refresh
```json
// Request
{ "refresh_token": "eyJ..." }

// Response 200
{ "access_token": "eyJ...", "refresh_token": "eyJ...", "token_type": "bearer" }
```

### GET /auth/me
Retourne l'utilisateur courant.

---

## Assistants

### GET /assistants
Liste les assistants du workspace.

### POST /assistants
Cr\u00e9er un assistant. Le system prompt est g\u00e9n\u00e9r\u00e9 automatiquement.

```json
// Request
{
  "name": "Assistant Commercial",
  "objective": "Aider les prospects \u00e0 choisir le bon produit",
  "tone": "friendly",
  "language": "fr",
  "custom_rules": "Toujours proposer une d\u00e9mo"
}

// Response 201
{
  "id": "uuid",
  "name": "Assistant Commercial",
  "system_prompt": "Tu es un assistant...",
  "status": "active",
  ...
}
```

### GET /assistants/{id}
D\u00e9tail d'un assistant.

### PATCH /assistants/{id}
Mise \u00e0 jour partielle. Si `objective` change, le system prompt est r\u00e9g\u00e9n\u00e9r\u00e9.

### DELETE /assistants/{id}

---

## Chat

### POST /assistants/{id}/chat
Envoyer un message (RAG + m\u00e9moire inclus).

```json
// Request
{
  "message": "Quels sont vos produits phares ?",
  "conversation_id": null  // null = nouvelle conversation
}

// Response 200
{
  "conversation_id": "uuid",
  "message": "Nos produits phares sont...",
  "sources": [
    {"source_name": "Catalogue 2024", "text": "...", "score": 0.87}
  ],
  "tokens_used": 450
}
```

### GET /assistants/{id}/chat/conversations
Liste des conversations.

### GET /assistants/{id}/chat/conversations/{conv_id}/messages
Historique des messages.

---

## Base de Connaissances (RAG)

### GET /assistants/{id}/knowledge
Liste les sources de connaissances.

### POST /assistants/{id}/knowledge/upload
Upload un fichier (multipart/form-data).
- Champs : `name` (string), `file` (fichier PDF/DOC/TXT)

### POST /assistants/{id}/knowledge/url
Crawler une URL.
```json
{ "name": "Site web", "url": "https://example.com" }
```

### POST /assistants/{id}/knowledge/text
Coller du texte.
```json
{ "name": "FAQ", "text": "Question 1: ... R\u00e9ponse: ..." }
```

### DELETE /assistants/{id}/knowledge/{kb_id}

---

## LiveKit (Voix)

### POST /livekit/token
G\u00e9n\u00e9rer un token LiveKit pour un appel vocal.

```json
// Request
{ "assistant_id": "uuid" }

// Response 200
{
  "token": "eyJ...",
  "room_name": "emefa-abc-def",
  "livekit_url": "ws://localhost:7880",
  "agent_token": "eyJ..."
}
```

---

## Actions (Outils)

### GET /actions
Liste toutes les actions disponibles.

### POST /actions/execute
Ex\u00e9cuter une action (avec v\u00e9rification des permissions).

```json
// Request
{
  "assistant_id": "uuid",
  "action_name": "send_email",
  "params": {"to": "dest@example.com", "subject": "Bonjour"}
}
```

---

## Webhooks

### POST /webhooks/telegram/{assistant_id}
Webhook Telegram Bot API (configur\u00e9 via `setWebhook`).

### GET /webhooks/whatsapp
V\u00e9rification webhook WhatsApp Cloud API.

### POST /webhooks/whatsapp
R\u00e9ception de messages WhatsApp Cloud API.

---

## WhatsApp QR (Non-officiel)

### GET /whatsapp-qr/{assistant_id}/qr
R\u00e9cup\u00e9rer le QR code WhatsApp (si activ\u00e9).

---

## Administration

### GET /admin/stats
Statistiques du workspace (assistants, conversations, tokens, membres).

### GET /admin/audit
Journal d'audit (Owner/Admin uniquement).
- Query params : `limit` (d\u00e9faut 50, max 200), `offset`

---

## Health Check

### GET /health
```json
{ "status": "healthy", "app": "EMEFA", "version": "0.1.0" }
```
