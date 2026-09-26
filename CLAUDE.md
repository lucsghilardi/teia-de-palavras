# Teia de Palavras — guia para agentes

Portal de alfabetização infantil (método Paulo Freire). Ver `README.md` para
subir o projeto e o plano de fases.

## Regras de negócio inegociáveis
- Cada aula tem UMA palavra geradora; sílabas geram famílias (TE → TA TE TI TO TU).
- Famílias ACUMULAM entre aulas: sílabas de aulas anteriores seguem disponíveis.
- Nunca mostrar "errado", nota ou ranking à criança. Tentativa inválida → dica gentil; acerto → celebração.
- Palavra válida descoberta entra na Teia de Palavras da criança.
- Áudio: gravação aprovada > arquivo da aula > Web Speech API pt-BR.
- LGPD: criança tem só apelido, avatar e turma. Cadastro pelo responsável com consentimento. Áudios em disco privado.

## Arquitetura
- Laravel 12 API-first em `backend/laravel`. Dois guards JWT (tymon): `api` (User: admin|educador) e `crianca` (Crianca).
  A claim `prv` do tymon impede usar um token no guard do outro.
- Rotas em `routes/api/*.php` por área; controllers em `App\Http\Controllers\Api\{Painel,Crianca,Turma}`; regras em `App\Services`.
- Código novo usa FormRequest e API Resource. Nomes de domínio em português; tabelas de framework em inglês.
- Reverb: canais em `routes/channels.php` SEMPRE com `['guards' => ['api', 'crianca']]`; rota de auth em `/api/broadcasting/auth`.
- Next 16 em `frontend`: o navegador nunca vê o JWT; ele fica em cookie httpOnly (`teia_sessao`) e o proxy
  `app/api/proxy/[...path]` injeta o Bearer e renova no 401. `apiFetch` em `services/api.ts`.
- Painel do educador em `app/(painel)/painel/*` (shadcn). App da criança em `app/(crianca)/app/*`
  (botões ≥ 64px, caixa alta na Fase 1, áudio em todo toque, prefers-reduced-motion).

## Comandos
- Testes backend: `docker compose exec backend php artisan test` (Pest, PostgreSQL `teia_test`).
- Estilo PHP: `./vendor/bin/pint`. Front: `npm run lint && npm run build` em `frontend`.
- Front: `npm test` (Vitest, lógica pura em `lib/aula`) e `npm run test:e2e` (Playwright, missão TEIA
  só com toques em tablet e celular; exige o compose de dev no ar).
- Contratos: `docs/api-painel.md` e `docs/api-crianca.md`. Mudou endpoint? Atualize o contrato junto.
- App da criança: todo botão ≥ 64 px e página sem rolagem lateral (o E2E confere); voz em `lib/fala.ts`
  (URL de áudio se houver, senão Web Speech), nunca bloquear a tela esperando áudio terminar.

## Bases de origem (não editar)
- `~/Sites/projeto_pessoal`: auth/proxy/shadcn/gamificação copiados.
- `~/Sites/Nitrogym-Full`: padrão Reverb + Echo + proxy com refresh.
