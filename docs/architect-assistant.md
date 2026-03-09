# EMEFA - Assistant Architecte

## Vue d'ensemble

L'Assistant Architecte est un template préconfiguré dans EMEFA qui aide les architectes à transformer leurs idées, plans et références visuelles en maquettes 3D via Blender. Il fonctionne en **mode coaching** : il propose, attend validation, puis exécute.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    EMEFA Cloud                        │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ Templates │  │ Bridge    │  │ Architect        │  │
│  │ API       │  │ Manager   │  │ Projects API     │  │
│  └──────────┘  └─────┬─────┘  └──────────────────┘  │
│                       │ WebSocket                     │
└───────────────────────┼──────────────────────────────┘
                        │ (chiffré, token auth)
┌───────────────────────┼──────────────────────────────┐
│  PC de l'architecte   │                              │
│  ┌────────────────────┴───────────────────────────┐  │
│  │         Desktop Bridge (emefa_bridge.py)       │  │
│  │  - Reçoit les commandes du cloud               │  │
│  │  - Exécute les scripts dans Blender            │  │
│  │  - Renvoie les résultats                       │  │
│  └────────────────────┬───────────────────────────┘  │
│                       │                              │
│  ┌────────────────────┴───────────────────────────┐  │
│  │              Blender 3.6+                      │  │
│  │  - Scripts Python (create_object, render...)   │  │
│  │  - Export .blend, .glb, .fbx, PNG              │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

## Installation

### 1. Backend (déjà inclus dans EMEFA)

Les templates sont seedés automatiquement au démarrage. Vérifiez que la migration est appliquée :

```bash
cd backend
alembic upgrade head
```

### 2. Desktop Bridge (sur le PC de l'architecte)

**Prérequis :**
- Python 3.10+
- Blender 3.6+ installé

```bash
# Installer les dépendances
cd desktop-bridge
pip install -r requirements.txt

# Lancer le bridge
python emefa_bridge.py \
  --server ws://votre-serveur-emefa:8000 \
  --device-id <DEVICE_ID> \
  --token <DEVICE_TOKEN> \
  --blender-path "C:\Program Files\Blender Foundation\Blender 4.0\blender.exe"
```

Le `DEVICE_ID` et `DEVICE_TOKEN` sont obtenus lors de l'enregistrement du device dans l'interface EMEFA.

## Scénario de démo

1. **Créer un assistant** : Dashboard → "Depuis un template" → "Assistant Architecte"
2. **Créer un projet** : Onglet "Architecte" → Remplir le brief et la checklist
3. **Ajouter des références** : Onglet "Références" → Upload plans/photos
4. **Connecter Blender** : Bouton "Connecter mon PC" → Suivre les instructions
5. **Générer le plan** : Cliquer "Générer le plan" → 6 étapes sont créées
6. **Exécuter** : Cliquer "Exécuter" sur chaque étape → Le bridge pilote Blender
7. **Récupérer les fichiers** : Onglet "Résultat" → Télécharger .blend, .glb, rendus PNG

## API Reference

### Templates

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/templates` | Lister les templates |
| GET | `/api/v1/templates/{id}` | Détail d'un template |
| GET | `/api/v1/templates/{id}/export` | Export JSON du template |
| POST | `/api/v1/templates/{id}/create-assistant` | Créer un assistant depuis un template |

### Bridge

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/bridge/devices` | Enregistrer un appareil |
| GET | `/api/v1/bridge/devices` | Lister les appareils |
| PATCH | `/api/v1/bridge/devices/{id}/permissions` | Modifier les permissions |
| DELETE | `/api/v1/bridge/devices/{id}` | Révoquer un appareil |
| GET | `/api/v1/bridge/devices/{id}/status` | Statut en ligne |
| GET | `/api/v1/bridge/commands` | Lister les commandes Blender |
| POST | `/api/v1/bridge/actions` | Créer une action |
| POST | `/api/v1/bridge/actions/{id}/approve` | Approuver/rejeter une action |
| WS | `/api/v1/bridge/ws/{device_id}?token=<TOKEN>` | WebSocket bridge |

### Architect Projects

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/architect/projects` | Créer un projet |
| GET | `/api/v1/architect/projects` | Lister les projets |
| GET | `/api/v1/architect/projects/{id}` | Détail d'un projet |
| PATCH | `/api/v1/architect/projects/{id}` | Modifier un projet |
| POST | `/api/v1/architect/projects/{id}/references` | Ajouter une référence |
| POST | `/api/v1/architect/projects/{id}/generate-plan` | Générer le plan d'action |
| POST | `/api/v1/architect/projects/{id}/versions` | Créer une version |
| GET | `/api/v1/architect/projects/{id}/versions` | Lister les versions |

## Commandes Blender disponibles

| Commande | Description | Permission requise |
|----------|-------------|-------------------|
| `create_object` | Créer un objet 3D | `create_mesh` |
| `import_reference` | Importer une image de référence | `import_image` |
| `apply_material` | Appliquer un matériau | `create_mesh` |
| `set_dimensions` | Définir les dimensions | `create_mesh` |
| `setup_camera` | Positionner la caméra | `create_mesh` |
| `setup_lighting` | Configurer l'éclairage | `create_mesh` |
| `render` | Lancer un rendu | `export` |
| `export` | Exporter (.blend, .glb, .fbx) | `export` |
| `execute_script` | Script Python custom | `execute_script` (désactivé par défaut) |

## Sécurité

### Authentification du bridge
- Chaque device reçoit un token unique lors de l'enregistrement
- Le token est hashé (SHA-256) en base de données
- La connexion WebSocket requiert le token en paramètre de query

### Permissions explicites
- Par défaut : `open_blender`, `import_image`, `create_mesh`, `export` activés
- `execute_script` désactivé par défaut (risque d'exécution de code arbitraire)
- Chaque permission est modifiable par l'utilisateur via l'API

### Mode coaching (validation)
- Par défaut, chaque action requiert l'approbation de l'utilisateur
- L'action reste en statut `pending` jusqu'à approbation
- L'utilisateur peut approuver ou rejeter depuis l'interface

### Audit
- Chaque action bridge est loggée dans les audit_logs
- Chaque enregistrement/révocation de device est tracé
- Les actions incluent le type, les paramètres, le résultat

### Isolation
- Le Desktop Bridge s'exécute sur la machine de l'utilisateur
- Blender tourne en mode `--background` (pas d'interface)
- Aucun accès direct au système de fichiers depuis le cloud
- Révocation instantanée du device possible

## Extensibilité

L'architecture est conçue pour supporter d'autres logiciels CAO/BIM :

- **ArchiCAD** : via un connecteur MCP ou API ArchiCAD
- **Revit** : via l'API Forge/Revit
- **SketchUp** : via l'API Ruby SketchUp

Chaque nouveau connecteur s'implémente comme un nouveau type de bridge avec ses propres commandes et permissions.

## Scripts Blender

Les scripts exemples sont dans `templates/architecte/blender_scripts/` :

- `create_object.py` - Création d'objets 3D
- `apply_material.py` - Application de matériaux architecturaux
- `setup_scene.py` - Configuration de scène (caméra, éclairage, unités)
- `render_export.py` - Rendu et export multi-format
- `demo_house.py` - Script démo complet (maison simple)
