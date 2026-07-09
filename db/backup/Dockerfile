# Backup sidecar: real cron + the exact mysqldump that matches the db image.
FROM mysql:8.4

USER root
RUN microdnf install -y cronie findutils gzip && microdnf clean all

COPY backup.sh entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
