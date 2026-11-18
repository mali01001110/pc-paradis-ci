# Déploiement PC Paradis

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

## Déployer le backend sur Render

Le Blueprint à la racine du dépôt (`render.yaml`) configure l'API Django, un
worker Celery et Celery Beat. Il réutilise PostgreSQL et Redis existants : aucun
service de base de données ou de cache Render n'est créé. Les services Render
sont configurés dans la région de Francfort et utilisent le plan `0.5c-512mb`
(services payants; Celery nécessite un worker payant).

1. Dans Render, créer un Blueprint pour ce dépôt et appliquer `render.yaml`.
2. Renseigner les variables demandées dans le groupe `pc-paradis-production` :
   - `DATABASE_URL` : URL PostgreSQL accessible depuis Render, avec SSL. Pour
     Supabase, utiliser une URL de connexion ou de pooler accessible depuis
     l'extérieur et encoder les caractères spéciaux du mot de passe.
   - `DJANGO_ADMIN_URL` : chemin de l'interface d'administration, par exemple
     `admin/`. `DJANGO_ADMIN_USERNAME` doit être l'adresse email de connexion
     de l'administrateur; `DJANGO_ADMIN_PASSWORD` est son mot de passe.
     L'application ne crée pas automatiquement le compte.
   - `REDIS_URL` : URL Redis/Valkey accessible depuis Render (`rediss://` si
     TLS est requis). Elle alimente le cache Django et Celery.
   - `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` et `CSRF_TRUSTED_ORIGINS` :
     domaines publics du frontend (les origines doivent inclure `https://`).
   - SMTP : `EMAIL_HOST`, `EMAIL_HOST_USER` et `EMAIL_HOST_PASSWORD`.
   - Stockage S3/R2 : `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
     `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_ENDPOINT_URL`,
     `AWS_S3_REGION_NAME` et `AWS_S3_CUSTOM_DOMAIN`. Configurer le bucket et
     son domaine pour la lecture publique des images; ne pas utiliser le
     système de fichiers du service, qui est éphémère.
3. Le Blueprint génère `DJANGO_SECRET_KEY`, lance les migrations avant le
   déploiement web et vérifie `GET /api/health/`.
4. Dans l'environnement de build du frontend, définir `VITE_API_URL` sur
   l'origine Render de l'API (par exemple `https://pc-paradis-api.onrender.com`,
   sans `/api/v1`), puis reconstruire le frontend.
5. Pour créer manuellement le compte administrateur depuis le Shell du service
   web, mapper les variables vers les noms attendus par Django :

   ```sh
   DJANGO_SUPERUSER_EMAIL="$DJANGO_ADMIN_USERNAME" \
   DJANGO_SUPERUSER_PASSWORD="$DJANGO_ADMIN_PASSWORD" \
   python manage.py createsuperuser --noinput --email "$DJANGO_ADMIN_USERNAME"
   ```

Pour un domaine API personnalisé, ajouter son nom d'hôte à `ALLOWED_HOSTS` et
son origine HTTPS à `CSRF_TRUSTED_ORIGINS`. Render ajoute automatiquement son
propre nom d'hôte à `ALLOWED_HOSTS`.
