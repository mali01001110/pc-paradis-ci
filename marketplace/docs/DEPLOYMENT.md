# Déploiement PC Paradis CI

Guide de mise en production (HTTPS, backups, monitoring).

## Prérequis

- Serveur Ubuntu/Debian avec Docker + Docker Compose v2
- Nom de domaine (ex: `pcparadis.ci`) pointant vers le serveur (A record)
- Ports 80 et 443 ouverts

## 1. Préparer l'environnement

```bash
cp .env.example .env
```

Variables de production à définir dans `.env` :

| Variable | Description |
|---|---|
| `DJANGO_SECRET_KEY` | Clé secrète forte (requis, pas de fallback) |
| `ALLOWED_HOSTS` | `pcparadis.ci,api.pcparadis.ci` |
| `CORS_ALLOWED_ORIGINS` | `https://pcparadis.ci` |
| `CSRF_TRUSTED_ORIGINS` | `https://pcparadis.ci` |
| `DB_PASSWORD` | Mot de passe PostgreSQL fort |
| `EMAIL_BACKEND` | SMTP backend (ex: Resend, Brevo) |
| `FRONTEND_URL` | `https://pcparadis.ci` |

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"  # générer DJANGO_SECRET_KEY
```

## Premier déploiement

```bash
# 1. Construire et démarrer (HTTP d'abord, pour le défi ACME)
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# 2. Émettre le certificat Let's Encrypt (remplacer pcparadis.ci par votre domaine)
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot -d pcparadis.ci -d www.pcparadis.ci \
  --email admin@pcparadis.ci --agree-tos --no-eff-email

# 3. Redémarrer nginx pour activer HTTPS
docker compose -f docker-compose.prod.yml restart nginx
```

## HTTPS (renouvellement automatique)

Le service `certbot` renouvelle tous les 12h via webroot.
Vérification manuelle : `docker compose -f docker-compose.prod.yml exec certbot certbot certificates`

## Backups

Automatique (dans le compose) : dump gzip quotidien dans `./backups`, rétention 14 jours.
Script manuel/cron :

```bash
sh infrastructure/backup.sh          # dump + purge >14 jours
sh infrastructure/restore.sh backups/pcparadis_20260925.sql.gz
```

Cron recommandé : `0 3 * * * /srv/marketplace/infrastructure/backup.sh`

## Monitoring

- **Health check applicatif** : `GET /api/health/` → vérifie backend + PostgreSQL + Redis (503 si dégradé)
- Docker healthchecks sur `backend`, `nginx`, `db`, `redis` (`docker compose ps`)
- Uptime externe (UptimeRobot / Better Stack) : surveiller `https://pcparadis.ci/api/health/`
- Logs : `docker compose logs -f backend` (erreurs Django dans `django.security.log`)

## Commandes courantes

```bash
# Déployer / mettre à jour
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

# Logs
docker compose -f docker-compose.prod.yml logs -f backend

# Créer un admin Django
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# Collectstatic (déjà fait à l'image build)
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

## Checklist de mise en production

- [ ] `.env` avec `DJANGO_SECRET_KEY` fort (`python -c "import secrets; print(secrets.token_urlsafe(50))"`)
- [ ] `DEBUG=false`, `ALLOWED_HOSTS` restreint au domaine
- [ ] Certificats TLS émis (certbot webroot), renouvellement auto actif
- [ ] `python manage.py check --deploy` sans erreur
- [ ] Cron backup.sh actif + restauration testée
- [ ] `/api/health/` surveillé (HTTP 200)
