#!/usr/bin/env bash
# Liga e mantém o HTTPS de teiadepalavras.com.br na VPS. Idempotente; rode como root.
#
# Sem certificado: instala um vhost provisório só HTTP (responde 503 e é onde o
# certbot faz o desafio) e espera o DNS. Quando o domínio e o www apontarem para
# esta VPS, emite o certificado com `certbot certonly --nginx`, como nos outros
# sites daqui. Com certificado: instala o vhost definitivo
# (deploy/nginx/teiadepalavras.com.br.conf com a chave do Reverb) sempre que ele
# mudar, testando com nginx -t antes do reload.
#
# Cron provisório até o HTTPS ligar (o script se retira sozinho do crontab):
#   (crontab -l; echo '*/5 * * * * /opt/teia/deploy/ativar-https.sh >> /var/log/teia_https.log 2>&1') | crontab -
# Depois disso o deploy.sh o chama a cada deploy, para o vhost seguir o git.
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMINIO=teiadepalavras.com.br
VHOST="/etc/nginx/sites-available/$DOMINIO"
CERT="/etc/letsencrypt/live/$DOMINIO/fullchain.pem"
# Depois de uma falha do certbot, espera 1 h: o Let's Encrypt limita tentativas.
FALHOU=/var/lib/teia/https-falhou

log() { echo "[$(date '+%F %T')] $*"; }

# Grava o vhost e recarrega o nginx; com nginx -t falhando, devolve o anterior
# para não deixar uma config quebrada esperando o próximo reload dos outros sites.
instalar_vhost() {
  local anterior="" saida
  [[ -f $VHOST ]] && anterior="$(cat "$VHOST")"
  printf '%s\n' "$1" > "$VHOST"
  ln -sf "$VHOST" "/etc/nginx/sites-enabled/$DOMINIO"
  if ! saida="$(nginx -t 2>&1)"; then
    if [[ -n $anterior ]]; then
      printf '%s\n' "$anterior" > "$VHOST"
    else
      rm -f "$VHOST" "/etc/nginx/sites-enabled/$DOMINIO"
    fi
    echo "$saida" >&2
    return 1
  fi
  systemctl reload nginx
}

if [[ -f $CERT ]]; then
  chave="$(grep -E '^REVERB_APP_KEY=' "$APP_DIR/backend/laravel/.env" | cut -d= -f2-)"
  [[ -n $chave ]] || { log "REVERB_APP_KEY vazio no .env"; exit 1; }
  definitivo="$(sed "s/__REVERB_APP_KEY__/$chave/" "$APP_DIR/deploy/nginx/$DOMINIO.conf")"
  if [[ ! -f $VHOST || "$(cat "$VHOST")" != "$definitivo" ]]; then
    instalar_vhost "$definitivo"
    log "vhost definitivo instalado"
  fi
  if crontab -l 2>/dev/null | grep -q 'ativar-https\.sh'; then
    { crontab -l | grep -v 'ativar-https\.sh' || true; } | crontab -
    log "HTTPS ligado; ativar-https.sh saiu do cron"
  fi
  exit 0
fi

if [[ ! -f $VHOST ]]; then
  instalar_vhost "# Vhost provisório da Teia (só HTTP), do deploy/ativar-https.sh, até o
# certificado existir. O certbot --nginx faz o desafio do Let's Encrypt aqui.
server {
    listen 80;
    listen [::]:80;
    server_name $DOMINIO www.$DOMINIO;

    location / {
        default_type text/plain;
        return 503 \"Teia de Palavras: ligando o HTTPS, volte em alguns minutos.\\n\";
    }
}"
  log "vhost provisório (só HTTP) instalado; esperando o DNS"
fi

# O DNS já aponta para cá? Pergunta a um resolvedor público, sem cache local.
ip4="$(ip -4 route get 1.1.1.1 | awk '{for (i = 1; i < NF; i++) if ($i == "src") print $(i + 1)}')"
ip6="$(ip -6 addr show scope global | awk '/inet6/ {sub("/.*", "", $2); print $2; exit}')"
for nome in "$DOMINIO" "www.$DOMINIO"; do
  [[ "$(dig +short A "$nome" @1.1.1.1 | tail -1)" == "$ip4" ]] || exit 0 # ainda não; silencioso
  aaaa="$(dig +short AAAA "$nome" @1.1.1.1 | tail -1)"
  if [[ -n $aaaa && $aaaa != "$ip6" ]]; then
    log "$nome tem AAAA $aaaa, que não é desta VPS ($ip6): corrija o DNS"
    exit 0
  fi
done

if [[ -f $FALHOU && $(($(date +%s) - $(stat -c %Y "$FALHOU"))) -lt 3600 ]]; then
  exit 0
fi

log "DNS aponta para esta VPS; emitindo o certificado"
if certbot certonly --nginx --non-interactive \
  -d "$DOMINIO" -d "www.$DOMINIO" \
  --deploy-hook "systemctl reload nginx"; then
  rm -f "$FALHOU"
  exec "$0" # agora com certificado: instala o vhost definitivo
fi
install -d /var/lib/teia
touch "$FALHOU"
log "certbot falhou; nova tentativa em 1 hora"
exit 1
