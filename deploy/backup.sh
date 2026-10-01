#!/usr/bin/env bash
# Backup diário da Teia de Palavras. Cron do root, às 3h40 (os outros projetos da
# VPS usam 3h00, 3h20, 3h30 e 4h00):
#   40 3 * * * /opt/teia/deploy/backup.sh >> /var/log/teia_backup.log 2>&1
#
# Guarda três coisas, e as três são necessárias para restaurar:
#   1. o dump do Postgres (progresso, Teia e respostas das crianças)
#   2. storage/app: mídia das aulas, gravações e mini-aulas das crianças e as
#      vozes neurais (o banco só guarda o caminho; sem os arquivos ficam órfãos)
#   3. o .env (APP_KEY, JWT_SECRET, senhas e a chave da voz)
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
BACKUP_DIR=/var/backups/teia
RETENCAO_DIAS=30
STAMP="$(date +%Y-%m-%d_%H%M)"

install -d -m 700 "$BACKUP_DIR"
cd "$APP_DIR"

echo "[$(date -Is)] iniciando backup"

docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "$BACKUP_DIR/db_${STAMP}.dump"

docker compose exec -T php tar -czf - -C storage/app public private \
  > "$BACKUP_DIR/storage_${STAMP}.tar.gz"

cp backend/laravel/.env "$BACKUP_DIR/env_${STAMP}"

chmod 600 "$BACKUP_DIR"/*_"${STAMP}"*

# Retenção (vale também para os pre-deploy_*.dump do deploy.sh).
find "$BACKUP_DIR" -type f -mtime +"$RETENCAO_DIAS" -delete

echo "[$(date -Is)] backup local concluído em $BACKUP_DIR"

# ---------------------------------------------------------------------------
# Cópia para fora da VPS. Backup que só existe no mesmo servidor não é backup:
# se o disco morrer, os dois somem juntos. Configure um destes e descomente:
#
#   rclone (Google Drive, S3, Backblaze...):
#     rclone copy "$BACKUP_DIR" remoto:teia-backups --max-age 24h
#
#   outro servidor via SSH:
#     rsync -az --delete "$BACKUP_DIR/" usuario@host:/caminho/teia/
# ---------------------------------------------------------------------------
echo "AVISO: cópia externa não configurada; edite o fim deste script."
