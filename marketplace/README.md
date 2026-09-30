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

# Frontend (unit + composants)
cd frontend
npm test
npm run typecheck

# E2E (Playwright, 23 scénarios — lancement auto du dev server)
cd frontend
npm run test:e2e
```

Les tests E2E couvrent : inscription + captcha, vérification email, connexion + MFA, catalogue/filtres, contact produit, publication produit, modération admin, signalements et page vendeurs. Ils fonctionnent avec des APIs mockées (`tests/e2e/mocks.ts`) — aucun backend requis.

### Commandes de gestion (backend)

```bash
python manage.py seed_catalogue --demo    # Catégories + marques + caractéristiques (14 familles produits)
python manage.py rebuild_search_index     # Recalcule le vector FTS (titre, description, attributs, catégorie)
```

## API Endpoints (v1)

### Authentification vendeur
- `POST /api/v1/auth/register/` — Créer un compte
- `POST /api/v1/auth/verify-email/<token>/` — Confirmer l'email
- `POST /api/v1/auth/login/` — Connexion (JWT)
- `POST /api/v1/auth/token/refresh/` — Rafraîchir le token d'accès (rotation activée)
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
- `GET /api/v1/categories/<slug>/filter-options/` — Facettes dynamiques
- `GET /api/v1/brands/` — Marques
- `GET /api/v1/products/` — Annonces publiques (filtres : `?q=`, `?category=<slug>`, `?brand=<uuid>`, `?condition=`, `?shop=<slug>`, `?min_price=`, `?max_price=`, `?ordering=-price`)
- `GET /api/v1/products/<slug>/` — Détail produit (incrément vues)
- `GET /api/v1/sellers/` — Boutiques publiques (actives + vérifiées)

### Suivi de contact (vendeur)
- `POST /api/v1/products/<slug>/contact/` — Enregistrer un clic Appel/WhatsApp
- `GET /api/v1/contacts/stats/` — Stats contacts par produit (auth)
- `GET /api/v1/analytics/sellers/me/` — Analytics vendeur (vues, contacts, top produits)
- `GET /api/v1/analytics/products/<uuid>/` — Analytics par produit
- `GET /api/v1/analytics/admin/` — Analytics plateforme (staff)

### Modération (staff)
- `GET /api/v1/admin/products/?status=<statut>` — File de modération (staff)
- `POST /api/v1/admin/products/<id>/moderate/` — Action : approve, reject, hide, restore
- `GET /api/v1/admin/stats/` — Statistiques modération
- `GET|POST /api/v1/auth/admin/sellers/` — Gestion vendeurs (liste filtrable) + modération (suspend, ban, unsuspend)
- `POST /api/v1/products/<slug>/report/` — Signalement public (7 motifs)
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
- [x] Phase 11 — Tests (unit + integration + E2E : 181 tests backend, 17 tests vitest, 23 scénarios Playwright)
- [x] Phase 12 — Production (HTTPS/TLS, backups, monitoring : docker-compose.prod.yml, nginx TLS proxy, certbot auto-renew, pg_dump, healthchecks)

## Accessibilité

- Labels associés (`htmlFor`/`id`) sur tous les formulaires critiques (auth, MFA, mot de passe, sécurité, signalement)
- `aria-label` sur les contrôles icon-only (langue, devise, pagination, galerie, toasts)
- Dialogs Radix UI : focus trap, `role="dialog"`, fermeture Escape
- Toasts avec `aria-live="polite"` + `role="status"`
- Navigation clavier : contrastes AA, dark mode, focus rings Tailwind

## Design

- **UI** : Violet/blanc avec dark mode disponible (basculable)
- **Palette** : Primary `#7c3aed` (primary-600), accents lumineux
- **Typographies** : Space Grotesk (display/titres), Inter (corps)
- **Icônes** : Lucide React
- **Composants** : Radix UI (shadcn/ui)

## Licence

MIT