#!/usr/bin/env bash
# Deploy da Teia de Palavras na VPS. Idempotente; rode como root, de dentro do
# repositório (em produção, /opt/teia):
#
#   ./deploy/deploy.sh
#
# É também o que o deploy/auto-deploy.sh chama a cada commit novo na main. A
# primeira subida (.env, banco trazido do dev, nginx, HTTPS, crons) está em
# docs/deploy.md. Variáveis opcionais:
#   TEIA_BACKUPS     pasta do dump pré-deploy (padrão: /var/backups/teia)
#   TEIA_URL         endereço do teste de saúde (padrão: https://teiadepalavras.com.br)
#   TEIA_SEM_PULL=1  não atualiza o código (ensaio local)
#   COMPOSE_FILE / COMPOSE_PROJECT_NAME  as do próprio Docker, para ensaiar com
#                    um override (padrão: só docker-compose.prod.yml)
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

export COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"
COMPOSE=(docker compose)
ENV_FILE=backend/laravel/.env
BACKUPS="${TEIA_BACKUPS:-/var/backups/teia}"
URL="${TEIA_URL:-https://teiadepalavras.com.br}"
ULTIMO_DEPLOY=/var/lib/teia/ultimo-deploy

artisan() { "${COMPOSE[@]}" exec -T php php artisan "$@"; }

for arquivo in "$ENV_FILE" frontend/.env.production; do
  [[ -f $arquivo ]] || { echo "Falta $arquivo (veja docs/deploy.md)." >&2; exit 1; }
done

# O .env é montado nos containers, que rodam como www-data (uid 33). Com dono
# root e modo 600 o Laravel não consegue lê-lo e segue com os padrões, sem erro.
if [[ $EUID -eq 0 && "$(stat -c %u "$ENV_FILE")" != 33 ]]; then
  echo "==> Ajustando o dono do .env para www-data (uid 33)"
  chown 33:33 "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

if [[ "${TEIA_SEM_PULL:-0}" != 1 && -z "${TEIA_REEXEC:-}" ]]; then
  echo "==> Código"
  # Remoto e branch explícitos: sem eles o --ff-only tenta avançar todas as
  # branches que o fetch trouxe e falha quando o remoto tiver mais de uma.
  git pull --ff-only origin main
  # O pull pode ter trocado este arquivo, e o bash lê o script enquanto executa:
  # recomeça uma vez, já na versão nova.
  export TEIA_REEXEC=1
  exec "$0" "$@"
fi

echo "==> Backup do banco"
if [[ -n "$("${COMPOSE[@]}" ps -q --status running postgres 2>/dev/null)" ]]; then
  install -d -m 700 "$BACKUPS"
  dump="$BACKUPS/pre-deploy_$(date +%Y-%m-%d_%H%M%S).dump"
  # Usuário e banco vêm do env do próprio container: nada de `source` no .env.
  "${COMPOSE[@]}" exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > "$dump"
  chmod 600 "$dump"
  echo "    $dump"
else
  echo "    postgres fora do ar, sem backup (primeira subida?)"
fi

echo "==> Imagens"
"${COMPOSE[@]}" build

# A config do nginx do backend vai dentro da imagem. Com erro de sintaxe o
# container entraria em crash-loop e o site cairia; testar antes do `up`, com os
# containers antigos de pé, transforma o apagão em deploy abortado.
echo "==> Validando o nginx do backend"
docker run --rm --entrypoint nginx teia/backend-web:latest -t

echo "==> Subindo"
"${COMPOSE[@]}" up -d --remove-orphans
# O .env é montado como arquivo único, e o Docker amarra esse mount ao inode:
# editar com sed -i (ou um editor que salva arquivo novo) deixa o container
# lendo o antigo. Recriar religa o mount ao arquivo atual.
"${COMPOSE[@]}" up -d --force-recreate --no-deps php queue scheduler reverb
# php novo, IP novo: o nginx do backend se vira (resolver), mas o restart fecha
# a janela de 502.
"${COMPOSE[@]}" restart backend

echo "==> Esperando o php-fpm"
for _ in $(seq 1 30); do
  "${COMPOSE[@]}" exec -T php php -v >/dev/null 2>&1 && break
  sleep 2
done

echo "==> Banco e conteúdo"
# Sem cache durante as migrations: a do admin lê env() direto, e com o config
# em cache o env() devolve null e ela não faz nada.
artisan optimize:clear
artisan migrate --force
# Idempotente: cria só o que falta e nunca sobrescreve missão editada no painel.
# (Sobrescrever é `teia:reaplicar-conteudo --forcar`, à mão: apaga respostas.)
artisan db:seed --force

echo "==> Caches"
artisan optimize
# O opcache não confere data de arquivo (validate_timestamps=0): o restart
# garante que ninguém fica com uma versão compilada antes dos caches novos.
"${COMPOSE[@]}" restart php

echo "==> Limpando imagens órfãs"
docker image prune -f >/dev/null

if [[ $EUID -eq 0 ]]; then
  # O auto-deploy compara o origin/main com isto para não repetir o mesmo commit.
  install -d /var/lib/teia
  git rev-parse HEAD > "$ULTIMO_DEPLOY"

  # O vhost do nginx do host segue o git (e o HTTPS liga se o DNS já chegou).
  echo "==> nginx do host"
  "$APP_DIR/deploy/ativar-https.sh" || echo "    AVISO: o vhost do host não foi atualizado (veja acima); o anterior segue no ar" >&2
fi

echo "==> Saúde"
"${COMPOSE[@]}" ps --format '    {{.Service}}: {{.Status}}'
for alvo in "http://127.0.0.1:3005/app/entrar" "$URL/"; do
  if codigo=$(curl -sS -o /dev/null -w '%{http_code}' "$alvo" 2>/dev/null); then
    echo "    $codigo $alvo"
  else
    echo "    $alvo não respondeu (sem DNS ou HTTPS ainda?)"
  fi
done
echo "Deploy concluído em $(git rev-parse --short HEAD)."
