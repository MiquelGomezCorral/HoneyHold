#!/bin/sh
# Dumps the database to /backups (bind-mounted to ./backups on the host)
# and prunes dumps older than BACKUP_RETENTION_DAYS.
set -eu
[ -f /etc/backup.env ] && . /etc/backup.env

: "${MYSQL_HOST:=db}"
: "${MYSQL_DATABASE:=finance}"
: "${BACKUP_RETENTION_DAYS:=14}"

STAMP=$(date +%Y%m%d_%H%M%S)
FILE="/backups/${MYSQL_DATABASE}_${STAMP}.sql.gz"

mysqldump \
  --host="$MYSQL_HOST" \
  --user=root \
  --password="$MYSQL_ROOT_PASSWORD" \
  --single-transaction --routines --triggers \
  --databases "$MYSQL_DATABASE" | gzip > "$FILE"

echo "[backup] wrote $FILE ($(du -h "$FILE" | cut -f1))"

find /backups -name "${MYSQL_DATABASE}_*.sql.gz" -mtime +"$BACKUP_RETENTION_DAYS" -delete
