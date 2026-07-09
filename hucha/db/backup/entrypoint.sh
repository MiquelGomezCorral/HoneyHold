#!/bin/sh
# Registers the cron schedule from $BACKUP_CRON, takes one backup right away,
# then hands over to crond in the foreground.
set -e
: "${BACKUP_CRON:=0 3 * * *}"

# Cron jobs don't inherit container env vars → snapshot them for backup.sh.
{
  env | grep -E '^(MYSQL_|BACKUP_)' | while IFS='=' read -r k v; do
    printf "export %s='%s'\n" "$k" "$v"
  done
} > /etc/backup.env

echo "$BACKUP_CRON root /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" > /etc/cron.d/db-backup
chmod 0644 /etc/cron.d/db-backup

echo "[backup] schedule: $BACKUP_CRON · retention: ${BACKUP_RETENTION_DAYS:-14} days"
/usr/local/bin/backup.sh || echo "[backup] initial backup failed (db may still be starting)"

exec crond -n
