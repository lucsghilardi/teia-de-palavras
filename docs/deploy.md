# Produção: teiadepalavras.com.br

A Teia roda numa VPS Ubuntu 24.04 que divide o nginx e as portas com outros projetos, em
`/opt/teia`. O TLS fica no nginx do host. O compose de
produção é o `docker-compose.prod.yml`, e os scripts ficam em `deploy/`:

| Script | O que faz | Quando roda |
|---|---|---|
| `deploy.sh` | pull, dump, build, sobe, migrate, seed, caches, vhost do host | à mão ou pelo `auto-deploy.sh` |
| `auto-deploy.sh` | commit novo na `main` → `deploy.sh` | cron, a cada 3 min |
| `backup.sh` | banco + `storage/app` + `.env` em `/var/backups/teia` (30 dias) | cron, 3h40 |
| `ativar-https.sh` | vhost provisório, espera o DNS, certificado, vhost definitivo | cron a cada 5 min até ligar; depois a cada deploy |

## Como fica no ar

```
navegador ── https://teiadepalavras.com.br ──> nginx do host (TLS, deploy/nginx/teiadepalavras.com.br.conf)
   /app/<REVERB_APP_KEY>  websocket do Reverb ─┐
   /storage/              mídia das aulas      ├─> 127.0.0.1:8003  nginx do container backend ─> php-fpm / reverb
   /api/vozes/            voz neural (mp3)     ┘
   todo o resto           painel, app da criança e os proxies /api/proxy, /api/crianca-proxy, /api/auth
                                               ──> 127.0.0.1:3005  Next ─> http://backend/api (rede interna)
```

O app da criança também mora em `/app/*` (`/app/entrar`, `/app/roda`...): o vhost manda ao Reverb
só o caminho exato da chave. Nunca troque isso por um `location /app`. Na VPS, 3000-3004, 8080,
8090 e 8094 são de outros projetos.

## 1. Domínio e DNS

1. Registre `teiadepalavras.com.br` no [registro.br](https://registro.br). Quem for titular (CPF
   ou CNPJ) deve ser quem aparece como controlador dos dados na LGPD.
2. No painel do domínio, use os servidores DNS do próprio registro.br e crie quatro registros:

   | Nome | Tipo | Valor |
   |---|---|---|
   | `teiadepalavras.com.br` | A | IPv4 da VPS |
   | `www.teiadepalavras.com.br` | A | IPv4 da VPS |
   | `teiadepalavras.com.br` | AAAA | IPv6 da VPS |
   | `www.teiadepalavras.com.br` | AAAA | IPv6 da VPS |

   Na VPS: `ip -4 route get 1.1.1.1` e `ip -6 addr show scope global` mostram os dois.

O `ativar-https.sh` está no cron: assim que o DNS responder com esses IPs, ele emite o certificado
e liga o site (em até 5 minutos, depois de o DNS propagar). O log fica em `/var/log/teia_https.log`.

## 2. Configuração na VPS

```bash
git clone https://github.com/lucsghilardi/teia-de-palavras.git /opt/teia
```

### backend/laravel/.env

Parta do `.env.example` e ajuste:

| Variável | Produção |
|---|---|
| `APP_ENV` / `APP_DEBUG` / `LOG_LEVEL` | `production` / `false` / `warning` |
| `APP_URL`, `FRONTEND_URL` | `https://teiadepalavras.com.br` (mídia e vozes saem com essa base) |
| `APP_KEY`, `JWT_SECRET` | novos: `base64:$(openssl rand -base64 32)` e `$(openssl rand -hex 32)` |
| `DB_PASSWORD` = `POSTGRES_PASSWORD` | senha forte, a mesma nas duas |
| `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET` | novos (`openssl rand -hex 10` para a chave) |
| `REVERB_HOST` / `REVERB_PORT` / `REVERB_SCHEME` | `reverb` / `8080` / `http` (rede interna) |
| `REVERB_ALLOWED_ORIGINS` | `teiadepalavras.com.br` (só o host, sem esquema) |
| `TEIA_VOZ_*` | **iguais aos do Mac**: as vozes copiadas são achadas pelo hash de provedor + voz + velocidade + texto |
| `MAIL_MAILER` | `log` (o sistema não envia e-mail) |
| `ADMIN_*` | vazios quando o banco vem do Mac (o admin vem junto) |

O dono do arquivo é o `www-data`: `chown 33:33 backend/laravel/.env && chmod 600 backend/laravel/.env`
(o `deploy.sh` corrige se esquecer). Com dono root e modo 600 o Laravel não consegue ler o arquivo
e segue com os padrões, sem erro nenhum.

**Editando depois:** o `.env` é montado como arquivo único e o Docker prende o mount ao inode.
`sed -i` e editores que salvam um arquivo novo deixam o container lendo o antigo. Rode
`./deploy/deploy.sh` depois de editar: ele recria os containers PHP. Se você trocar o
`REVERB_APP_KEY`, mude também o `frontend/.env.production`.

Não há campos criptografados no banco, então um `APP_KEY` novo não estraga os dados trazidos do Mac.

### frontend/.env.production

Os `NEXT_PUBLIC_*` são embutidos no build (o `frontend/Dockerfile` lê este arquivo; não passe
`--build-arg` com esses nomes).

```
NEXT_PUBLIC_API_URL=http://backend/api
NEXT_PUBLIC_REVERB_APP_KEY=<o mesmo REVERB_APP_KEY do backend>
NEXT_PUBLIC_REVERB_HOST=
NEXT_PUBLIC_REVERB_PORT=443
NEXT_PUBLIC_REVERB_SCHEME=https
```

`NEXT_PUBLIC_REVERB_HOST` vazio = o próprio host do site.

## 3. Primeira subida, com os dados do Mac

O banco de desenvolvimento tem o progresso de verdade (turma "Casa"). Ele vai inteiro, junto com a
mídia das aulas, os áudios das mini-aulas e as vozes já geradas.

**No Mac**, na raiz do repositório:

```bash
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > ~/Sites/teia-backups/teia-para-producao.dump
COPYFILE_DISABLE=1 tar --no-xattrs -czf ~/Sites/teia-backups/teia-storage.tar.gz -C backend/laravel/storage/app public private
scp ~/Sites/teia-backups/teia-para-producao.dump ~/Sites/teia-backups/teia-storage.tar.gz <vps>:/var/backups/teia/
```

**Na VPS**, em `/opt/teia`:

```bash
export COMPOSE_FILE=docker-compose.prod.yml
docker compose build
docker compose up -d --wait postgres
docker compose exec -T postgres sh -c 'pg_restore --no-owner --role="$POSTGRES_USER" -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < /var/backups/teia/teia-para-producao.dump
TEIA_SEM_PULL=1 ./deploy/deploy.sh             # sobe tudo, migrate (nada a fazer), seed idempotente, caches
docker compose exec -T php tar -xzf - -C storage/app < /var/backups/teia/teia-storage.tar.gz
docker compose exec -T php php artisan teia:gerar-vozes --todas --so-contar   # deve dizer "Faltam 0 frases"
```

**Limpeza obrigatória.** O repositório é público e o E2E usa uma turma de código fixo (`E2ETST`, com
as crianças "Teste" e "Bia" e figuras conhecidas). Ela não pode existir em produção:

```bash
docker compose exec -T -e HOME=/tmp php php artisan tinker --execute='
DB::transaction(function () {
    $educador = App\Models\User::where("email", "e2e-educador@teia.local")->first();
    $turma = App\Models\Turma::where("codigo", "E2ETST")->first();
    if ($turma) {
        App\Models\Crianca::withTrashed()->where("turma_id", $turma->id)->get()->each->forceDelete();
        $turma->delete();
    }
    if ($educador) {
        App\Models\TurmaSessao::where("educador_user_id", $educador->id)->delete();
        $educador->delete();
    }
});
echo "turmas: ".App\Models\Turma::pluck("nome")->join(", ").PHP_EOL;'
```

(`HOME=/tmp` porque o tinker quer gravar config e o `www-data` não tem home gravável.)

Depois do primeiro login no painel, troque a senha do admin: ela é a mesma do ambiente de
desenvolvimento.

**Crons** (`crontab -e` do root):

```
*/3 * * * * /opt/teia/deploy/auto-deploy.sh >> /var/log/teia_auto_deploy.log 2>&1
40 3 * * * /opt/teia/deploy/backup.sh >> /var/log/teia_backup.log 2>&1
*/5 * * * * /opt/teia/deploy/ativar-https.sh >> /var/log/teia_https.log 2>&1
```

A última linha sai sozinha do crontab quando o HTTPS liga.

## 4. Conferir

```bash
curl -sI http://teiadepalavras.com.br | grep -i location        # https://teiadepalavras.com.br/
curl -sI https://www.teiadepalavras.com.br | grep -i location   # https://teiadepalavras.com.br/
curl -s -o /dev/null -w '%{http_code}\n' https://teiadepalavras.com.br/app/entrar   # 200 (Next, não Reverb)
KEY=$(grep '^REVERB_APP_KEY=' /opt/teia/backend/laravel/.env | cut -d= -f2-)
curl -si --http1.1 --max-time 3 -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Origin: https://teiadepalavras.com.br" "https://teiadepalavras.com.br/app/$KEY?protocol=7" \
  | head -c 400   # HTTP/1.1 101 ... pusher:connection_established
```

No navegador:
- Painel: login do admin; o cookie `teia_sessao` tem `Secure`.
- Tablet: o Gustavo entra com o código da turma e a figura, e o progresso (etapa, XP, Teia) está
  igual ao do Mac. As vozes tocam sem atraso (vêm do cache).
- Roda: abra uma no painel, entre pelo QR (`/app/roda?codigo=`) e veja a atualização na hora. Na
  aba Network do navegador aparece o websocket conectado, e não as chamadas de polling a cada 5 s.

## 5. Atualizações

Basta dar push na `main`: em até 3 minutos o `auto-deploy.sh` roda o `deploy.sh`
(log em `/var/log/teia_auto_deploy.log`). À mão: `cd /opt/teia && ./deploy/deploy.sh`.

O `deploy.sh` faz, nesta ordem:
1. `git pull --ff-only origin main`.
2. Um dump em `/var/backups/teia/pre-deploy_*.dump`.
3. Refaz as imagens e valida o nginx da imagem nova antes de derrubar qualquer coisa.
4. Sobe tudo e recria os containers PHP, o que religa o `.env`.
5. Roda `migrate` e `db:seed`. O seed nunca sobrescreve missão editada no painel.
6. Recria os caches e atualiza o vhost do host pelo `ativar-https.sh`.

Um erro de build (TypeScript, Composer) aborta antes do passo 4, e o site segue na versão anterior.
O auto-deploy tenta cada commit uma vez só. Se falhar, o próximo push ou um `deploy.sh` à mão
tenta de novo.

Ele **nunca** roda `teia:reaplicar-conteudo --forcar`, que apaga as respostas das crianças nas
missões sobrescritas. Esse comando é só à mão, depois de um backup.

## 6. Backups

O `backup.sh` roda às 3h40 e guarda em `/var/backups/teia`, por 30 dias, três arquivos:
- `db_*.dump`: o banco.
- `storage_*.tar.gz`: mídia, gravações e mini-aulas das crianças, e as vozes.
- `env_*`: o `.env`.

Ainda falta a cópia para fora da VPS (veja o fim do script). Para restaurar:

```bash
cd /opt/teia && export COMPOSE_FILE=docker-compose.prod.yml
docker compose stop php backend frontend queue scheduler reverb
docker compose exec -T postgres sh -c 'pg_restore --clean --if-exists --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < /var/backups/teia/db_<data>.dump
docker compose start php
docker compose exec -T php tar -xzf - -C storage/app < /var/backups/teia/storage_<data>.tar.gz
TEIA_SEM_PULL=1 ./deploy/deploy.sh
```

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Migrations rodam num banco que não existe / sqlite | `.env` com dono root e modo 600: `chown 33:33` (o `deploy.sh` corrige) |
| Mudei o `.env` e nada mudou | o mount está preso ao inode antigo: rode `./deploy/deploy.sh` |
| A Roda só atualiza a cada 5 s | `NEXT_PUBLIC_REVERB_APP_KEY` vazio ou diferente do backend no build. Corrija o `.env.production` e rode o `deploy.sh` |
| O websocket conecta e recebe `pusher:error` 4009 | `REVERB_ALLOWED_ORIGINS` não tem `teiadepalavras.com.br` |
| Imagens das aulas ou a voz dão 404 | `APP_URL` errado, ou o vhost do host sem os `location` de `/storage/` e `/api/vozes/` |
| Vozes sendo geradas de novo (custo no Google) | `TEIA_VOZ_*` diferente do Mac: o hash muda com provedor, voz e velocidade |
| O site responde 503 "ligando o HTTPS" | o DNS ainda não aponta para a VPS (veja `/var/log/teia_https.log`) |
| `tinker` reclama de `/var/www/.config/psysh` | use `docker compose exec -e HOME=/tmp php php artisan tinker` |
