# Teia de Palavras — guia para agentes

Portal de alfabetização infantil (método Paulo Freire). Ver `README.md` para
subir o projeto e o plano de fases.

## Regras de negócio inegociáveis
- Uma aula pertence a uma disciplina (`App\Enums\Disciplina`: portugues, matematica, geografia,
  historia) e é uma sequência de atividades (`aula_atividades`; tipos em `App\Services\Atividades\RegistroAtividades`,
  formato do `config` em `docs/atividades.md`). Tipo novo = avaliador novo no registro + componente no front.
- Aula de Português tem UMA palavra geradora; sílabas geram famílias (TE → TA TE TI TO TU).
- Famílias ACUMULAM entre aulas: sílabas de aulas anteriores seguem disponíveis.
- Progresso da criança: `etapa_atual` vai de 1 a N+1 (N atividades; N+1 é a conquista). Nada de `Aula::ETAPAS`.
- Nunca mostrar "errado", nota ou ranking à criança. 1º erro → mensagem curta + dica; 2º erro → a resposta e o item
  entra na revisão espaçada (`crianca_itens`, caixas de Leitner em `App\Services\Revisao`); acerto → celebração.
  XP só no primeiro acerto de cada item; nível pela tabela `config('teia.niveis')`; medalhas em `config/conquistas.php`.
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
- Painel do educador em `app/(painel)/painel/*` (shadcn). App da criança em `app/(crianca)/app/*`:
  tema Espaço (tokens em `globals.css` `.tema-crianca`, fonte Lexend, ícones lucide via `lib/icones.ts`,
  NUNCA emoji na tela), Galáxia (`GET /crianca/galaxia`) → planeta (`/app/planeta/{disciplina}`) → missão.
  Botões ≥ 64px, áudio em todo toque, prefers-reduced-motion. `usa_minusculas` = "texto como escrito"
  (padrão true; `lib/exibir.ts`: `exibir` para frases, `exibirPalavra` para peças/palavras);
  `narracao_automatica` por criança (`useFalarAoChegar`/`useNarracaoDeChegada` respeitam).

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
