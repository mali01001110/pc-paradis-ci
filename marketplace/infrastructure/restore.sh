#!/bin/sh
# Restore a backup: sh infrastructure/restore.sh backups/pcparadis_20260925.sql.gz
set -eu
FILE="$1"
[ -f "$FILE" ] || { echo "Usage: $0 <backup.sql.gz>"; exit 1; }
gunzip -c "$FILE" | docker compose exec -T db psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-pc_paradis}"
echo "Restore complete."
