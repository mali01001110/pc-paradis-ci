#!/bin/sh
# Nightly PostgreSQL backup with 14-day retention.
# Cron: 0 3 * * * /path/to/marketplace/infrastructure/backup.sh
set -eu
cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS=14
STAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
docker compose exec -T db pg_dump -U "${DB_USER:-postgres}" "${DB_NAME:-pc_paradis}" | gzip > "$BACKUP_DIR/pcparadis_${STAMP}.sql.gz"
echo "$(date -Iseconds) backup written: pcparadis_${STAMP}.sql.gz"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
