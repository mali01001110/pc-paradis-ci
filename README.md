# PC Paradis CI — Marketplace PC Hardware & Gaming

Marketplace spécialisée PC Hardware et Gaming pour la Côte d'Ivoire.

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend  | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend   | Django 5.2 + Django REST Framework |
| Base de données | PostgreSQL 16 |
| Cache / Broker | Redis 7 |
| Tâches asynchrones | Celery |
| API | REST v1 (OpenAPI/Swagger) |

## Prérequis

- Docker & Docker Compose
- Python 3.14+ (backend natif si sans Docker)
- Node.js 22+ (frontend natif si sans Docker)

## Démarrage rapide

### Avec Docker (recommandé)

```bash
# 1. Cloner et configurer
cp .env.example .env

# 2. Lancer tous les services
docker compose up --build

# 3. Appliquer les migrations
docker compose exec backend python manage.py migrate

# 4. Créer un superuser admin
docker compose exec backend python manage.py createsuperuser
```

Les services seront disponibles sur :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000
- **Swagger** : http://localhost:8000/api/docs/
- **API Health** : http://localhost:8000/api/health/

### Sans Docker (développement local)

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp ../.env.example .env
python manage.py migrate
python manage.py runserver

# Frontend (autre terminal)
cd frontend
npm install
npm run dev
```

## Structure du projet

```
marketplace/
├── backend/
│   ├── config/          # Settings Django (base/dev/prod/test)
│   ├── apps/accounts/  # Auth, profil vendeur
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/       # Route pages
│   │   ├── components/  # Composants réutilisables
│   │   ├── layouts/     # Mise en page
│   │   ├── services/    # API client (axios)
│   │   ├── hooks/       # React hooks (useAuth)
│   │   └── types/       # Types TypeScript
│   ├── package.json
│   └── vite.config.ts
├── infrastructure/docker/
├── docker-compose.yml
├── .env.example
└── README.md
```

## Tests

```bash
# Backend
cd backend
pytest --cov=apps

# Frontend
cd frontend
npm test
npm run typecheck
```

## API Endpoints (v1)

### Authentification vendeur
- `POST /api/v1/auth/register/` — Créer un compte
- `POST /api/v1/auth/verify-email/<token>/` — Confirmer l'email
- `POST /api/v1/auth/login/` — Connexion (JWT)
- `POST /api/v1/auth/mfa/verify/` — Vérifier code MFA
- `POST /api/v1/auth/logout/` — Déconnexion
- `POST /api/v1/auth/password/reset/` — Demande de réinitialisation
- `POST /api/v1/auth/password/reset/confirm/` — Confirmer la réinitialisation
- `GET|PATCH /api/v1/auth/me/` — Profil vendeur
- `POST /api/v1/auth/mfa/enable/` — Activer MFA
- `POST /api/v1/auth/mfa/disable/` — Désactiver MFA

### Catalogue & produits
- `GET /api/v1/categories/` — Arbre des catégories (2 niveaux)
- `GET /api/v1/categories/<slug>/attributes/` — Caractéristiques dynamiques
- `GET /api/v1/brands/` — Marques
- `GET /api/v1/products/` — Annonces publiques (filtres : `?q=`, `?category=<slug>`, `?brand=<uuid>`, `?condition=`, `?shop=<slug>`, `?min_price=`, `?max_price=`, `?ordering=-price`)
- `GET /api/v1/products/<slug>/` — Détail produit (incrément vues)

### Suivi de contact (vendeur)
- `POST /api/v1/products/<slug>/contact/` — Enregistrer un clic Appel/WhatsApp
- `GET /api/v1/contacts/stats/` — Stats contacts par produit (auth)

### Modération (staff)
- `GET /api/v1/admin/products/?status=<statut>` — File de modération (staff)
- `POST /api/v1/admin/products/<id>/moderate/` — Action : approve, reject, hide, restore
- `POST /api/v1/products/<slug>/report/` — Signalement public
- `GET /api/v1/reports/` + `PATCH /api/v1/reports/<id>/` — Gestion des signalements (staff)

### SEO
- `GET /sitemap.xml` — Sitemap (produits, boutiques, catégories)
- `GET /robots.txt` — Règles crawlers

### Santé
- `GET /api/health/` — Vérification backend + PostgreSQL + Redis

Documentation complète : http://localhost:8000/api/docs/

## Phases de développement

- [x] Phase 1 — Foundation (scaffold, Docker, DB, Redis, CI)
- [x] Phase 2 — Authentification vendeur
- [x] Phase 3 — Seller / Shop / Dashboard
- [x] Phase 4 — Catalogue (catégories + caractéristiques dynamiques)
- [x] Phase 5 — Produits + upload images
- [x] Phase 6 — Marketplace (homepage, recherche, filtres, page produit)
- [x] Phase 7 — Contact (téléphone, WhatsApp, tracking)
- [x] Phase 8 — Administration & modération
- [x] Phase 9 — SEO (sitemap, structured data)
- [x] Phase 10 — Audit sécurité (pip-audit clean, npm audit runtime clean, JWT blacklist actif, Swagger privé en prod, fail-fast SECRET_KEY)
- [x] Phase 11 — Tests (unit + integration + E2E : 92 tests backend 96% coverage, 3 tests vitest, 8 scénarios Playwright)
- [x] Phase 12 — Production (HTTPS/TLS, backups, monitoring : docker-compose.prod.yml, nginx TLS proxy, certbot auto-renew, pg_dump, healthchecks)

## Design

- **UI** : Violet/blanc avec dark mode disponible (basculable)
- **Palette** : Primary `#7c3aed` (primary-600), accents lumineux
- **Typographies** : Space Grotesk (display/titres), Inter (corps)
- **Icônes** : Lucide React
- **Composants** : Radix UI (shadcn/ui)

## Licence

MIT