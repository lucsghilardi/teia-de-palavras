#!/usr/bin/env bash
# Deploy automático por polling, como nos outros projetos da VPS: o
# cron roda este script a cada 3 minutos e, quando a main do GitHub tem commit
# novo, chama o deploy.sh completo. O repositório é público, então o fetch vai
# por HTTPS sem chave nenhuma.
#
# Instalação (uma vez, como root na VPS):
#   (crontab -l; echo '*/3 * * * * /opt/teia/deploy/auto-deploy.sh >> /var/log/teia_auto_deploy.log 2>&1') | crontab -
#
# Cada commit é tentado UMA vez: se o deploy quebrar, o log diz o motivo e o
# próximo push (ou um ./deploy/deploy.sh à mão) tenta de novo. Repetir a cada
# tick refaria as imagens sem parar numa VPS que tem outros sistemas.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOCK_FILE=/var/lock/teia-auto-deploy.lock
ULTIMO_DEPLOY=/var/lib/teia/ultimo-deploy

cd "$APP_DIR"

# Uma execução por vez; se um deploy ainda está rodando, sai em silêncio.
exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

git fetch origin main --quiet

REMOTO="$(git rev-parse origin/main)"
ULTIMO="$(cat "$ULTIMO_DEPLOY" 2>/dev/null || git rev-parse HEAD)"

[[ "$REMOTO" == "$ULTIMO" ]] && exit 0 # nada novo; silencioso para não encher o log

install -d /var/lib/teia
echo "$REMOTO" > "$ULTIMO_DEPLOY"

echo "==> [$(date '+%F %T')] Commit novo: ${ULTIMO:0:7} -> ${REMOTO:0:7}. Iniciando deploy."
if "$APP_DIR/deploy/deploy.sh"; then
  echo "==> [$(date '+%F %T')] Deploy automático concluído em $(git rev-parse --short HEAD)."
else
  echo "==> [$(date '+%F %T')] Deploy de ${REMOTO:0:7} FALHOU; o site segue na versão anterior se o erro veio antes do 'Subindo'." >&2
  exit 1
fi
