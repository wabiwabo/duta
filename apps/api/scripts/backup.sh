#!/bin/bash
# Daily PostgreSQL backup for Duta Platform
# Run via cron: 0 2 * * * /opt/duta-api/scripts/backup.sh

set -euo pipefail

BACKUP_DIR="/opt/duta-api/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/duta_$TIMESTAMP.sql.gz"
RETENTION_DAYS=7

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Dump and compress
docker exec duta-api-postgres-1 pg_dump -U duta duta | gzip > "$BACKUP_FILE"

# Verify backup is non-empty
if [ ! -s "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file is empty" >&2
  rm -f "$BACKUP_FILE"
  exit 1
fi

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup created: $BACKUP_FILE ($SIZE)"

# Remove backups older than retention period
find "$BACKUP_DIR" -name "duta_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Cleaned up backups older than $RETENTION_DAYS days"

# TODO: Upload to R2 when credentials are configured
# aws s3 cp "$BACKUP_FILE" "s3://duta-backups/$BACKUP_FILE" --endpoint-url "$R2_ENDPOINT"
