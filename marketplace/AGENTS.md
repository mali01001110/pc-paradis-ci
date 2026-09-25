# AGENTS.md — PC Paradis CI

## Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (shadcn/ui patterns)
- **Backend**: Django 5.2 + Django REST Framework + SimpleJWT
- **Database**: PostgreSQL 16 + Redis 7 + Celery
- **API**: REST v1, versioned (`/api/v1/`), documented via drf-spectacular

## Règles de codage

### Général
- **Naming**: camelCase variables/fonctions, PascalCase classes/components, UPPER_SNAKE constants
- **Tests avant code** (TDD) : écrire les tests d'abord, puis implémenter
- **Couverture minimum** : 80% pour les modules critiques (auth, products, contact)
- **Linter/Typecheck** : `npm run lint && npm run typecheck` (frontend), `pytest` (backend)
- Ne jamais commiter de secrets ou credentials dans le code

### Backend (Django)
- Settings split : `config/settings/{base,development,production,test}.py`
- Apps sous `apps/`, pas à la racine du projet
- Modèles toujours avec UUID pk, indexes explicites, timestamps
- Tokens/codes MFA/sensibles : **jamais** loggés, **jamais** stockés en clair (hash only)
- Email : console backend en dev (`EMAIL_BACKEND=console`), templates HTML dans `templates/emails/`
- Images : `ImageField` avec Pillow, stockage local (prod : S3/R2)

### Frontend (React)
- Design system : Tailwind avec palette violet (`primary-600=#7c3aed`), dark mode via `class` strategy
- Composants : `class-variance-authority` (CVA) pour les variantes
- Formulaires : `react-hook-form` + `zod` + `zodResolver`
- API : axios interceptors pour le token JWT, service layer dans `services/api.ts`
- Auth state : hook `useAuth` dans `hooks/useAuth.tsx`

### Tests
- Backend : `pytest` + `factory_boy` + `model_bakery`, settings `config.settings.test` (SQLite in-memory)
- Frontend : `vitest` + `@testing-library/react`
- E2E : `playwright` (futur)
- Reset throttle cache entre tests via `django.core.cache.cache.clear()` (conftest.py)

### Sécurité (django-security skill)
- Password hashers : Argon2 first, PBKDF2 fallback
- CSRF + CORS : `corsheaders`, cookies secure en prod
- Rate limiting : DRF throttle classes sur les endpoints auth
- Validators : zod côté frontend, Django validators côté backend
- Input sanitation : never trust user input, never log sensitive values

## Commandes utiles

```bash
# Backend
cd backend && source .venv/bin/activate
python manage.py migrate
python manage.py createsuperuser
pytest --cov=apps

# Frontend
cd frontend
npm install
npm run dev
npm test
npm run typecheck
npm run lint

# Docker
docker compose up --build
docker compose exec backend python manage.py shell
```

## Configuration

```bash
cp .env.example .env
# Éditer .env avec les valeurs de production
```

## Architecture API (v1)

```
/api/v1/auth/     — Inscription, login, MFA, mot de passe, profil
/api/v1/products/ — [Phase 5]
/api/v1/categories/ — [Phase 4]
/api/v1/search/   — [Phase 6]
/api/v1/reports/  — [Phase 8]
/api/health/      — Health check (PG + Redis)
```

## Design tokens (Tailwind)

```
primary-600 : #7c3aed (boutons, accents)
dark bg     : #0f0a1e
card shadow : shadow-card
border     : rounded-card (14px)
```

## Phase actuelle

Phases 1-12 complètes (auth, boutique, catalogue, produits, marketplace, contact tracking, modération, SEO, audit sécurité, tests E2E, production). PC Paradis CI prêt pour le déploiement.