# A Roda (modo turma ao vivo) — contrato

A **Roda** é a missão ao vivo: o educador conduz uma missão no próprio dispositivo (ou no
projetor) e cada criança acompanha no dela, já logada no app. Escopo contido, de propósito:

- **Seguir o líder**: o educador escolhe a etapa (1..N+1, como no app individual) e todas as
  crianças veem a mesma atividade. Página da história e item de uma atividade ficam por conta
  de cada criança (o educador só marca `pagina`/`item` como referência).
- **Duplas automáticas**: sorteadas entre quem está na roda (quem sobra joga sozinho). Numa
  etapa de `montar_palavras` ou de qualquer atividade **avaliada**, uma criança **propõe** a
  resposta e o par **confirma** ("concordo") ou pede para **mudar**. Confirmar avalia a proposta
  para as duas crianças, com a mesma política das missões (palavra válida entra na Teia das duas
  com origem `dupla` e medalha "Ajudou um amigo"; atividade avaliada grava `crianca_respostas`,
  dá XP e agenda revisão para as duas). A vez alterna a cada resposta.
- **Turmas amigas** (ver `docs/api-painel.md`, Amizades): a criança de uma turma amiga vê a roda
  aberta na Galáxia e entra pelo código (QR/link `/app/roda?codigo=XXXXXX`).
- **Encerrar** conclui a missão para quem participou (XP da missão só na primeira vez).
- Sem criança-mestre nesta versão.

Tabelas: `turma_sessoes` (a roda: `codigo` de 6 caracteres, `status aguardando|em_andamento|encerrada`,
`etapa_atual`, `estado {pagina, item}`), `turma_sessao_participantes`, `duplas`, `dupla_tentativas`
(`atividade_ordem`, `resposta jsonb`, `status proposta|confirmada|recusada`, `valida`, `palavra_resultado`,
`dica`, `resultado jsonb`). Uma turma tem no máximo **uma roda aberta**.

## Tempo real

Laravel Reverb, um canal de presença por roda: `presence-roda.{id}` (no Echo: `echo.join("roda.{id}")`).
Entram o educador da turma (ou admin) e as crianças da turma **e das turmas amigas**.

- Membro educador: `{ id: "e{userId}", tipo: "educador", nome }`
- Membro criança: `{ id: "c{criancaId}", tipo: "crianca", crianca_id, apelido, avatar: OpcaoVisual|null }`
- Eventos (nomes com ponto no `listen`, pois usam `broadcastAs`):
  - `.roda.atualizada` → `RodaEstado` (snapshot completo; substitua o estado local)
  - `.dupla.atualizada` → `DuplaEstado` (cada criança filtra pela própria dupla)
- Ao (re)conectar, o cliente busca o snapshot pela API. Sem websocket (`NEXT_PUBLIC_REVERB_APP_KEY`
  vazio ou Reverb fora), `hooks/use-roda-tempo-real.ts` faz polling a cada 5 s.
- Autorização do canal: educador `POST /api/proxy/broadcasting/auth`; criança
  `POST /api/crianca-proxy/broadcasting/auth` (→ `/api/crianca/broadcasting/auth`, guard `crianca`).

## Tipos

```
RodaEstado = {
  id, codigo, status: "aguardando"|"em_andamento"|"encerrada",
  etapa_atual: 1..N+1, total_etapas: N+1,
  estado: { pagina, item },
  aula: { id, titulo, rotulo, disciplina, palavra_geradora|null, total_atividades },
  turma: { id, nome },
  participantes: [ { id, apelido, avatar: OpcaoVisual|null, presente } ],   // ordem de chegada; presente = não saiu
  duplas: [ { id, crianca_a_id, crianca_b_id } ],
  iniciada_em, encerrada_em, created_at }

DuplaEstado = {
  id, roda_id,
  criancas: [ { id, apelido, avatar } ],   // [a, b]
  vez_de: number,                          // quem propõe agora (a começa; alterna a cada resposta)
  tentativa: null | { id, atividade_ordem, resposta, proposta_por,
                      status: "proposta"|"confirmada"|"recusada",
                      valida: boolean|null, palavra: string|null, dica: string|null,
                      resultado: ResultadoTentativa|ResultadoResposta|null },   // avaliação (para quem propôs)
  palavras: [ { palavra, audio_url } ] }   // descobertas pela dupla nesta roda

ConteudoRoda = AulaCrianca (docs/api-crianca.md), com as peças liberadas até a missão da roda
  (a turma inteira usa as mesmas peças) e, para a criança, as metas/Teia dela.
```

## Painel (educador, guard `api`, prefixo `/api/painel`)

- `GET /rodas` → `RodaEstado[]` das turmas do educador (abertas primeiro, depois as 10 últimas encerradas).
- `POST /rodas` `{ turma_id, aula_id }` → 201 `RodaEstado` (status `aguardando`).
  422 `{ message, roda_id }` se a turma já tem roda aberta; 422 se a missão não está publicada; 403 turma de outro.
- `GET /rodas/{id}` → `{ roda: RodaEstado, conteudo: ConteudoRoda, criancas_da_turma: [ { id, apelido, avatar } ], duplas: DuplaEstado[] }`
- `POST /rodas/{id}/comandos` `{ acao, valor? }` → `RodaEstado` (e transmite `.roda.atualizada`). 422 depois de encerrada.
  - `iniciar` — sai de `aguardando`, etapa 1 (qualquer outro comando também tira de `aguardando`)
  - `avancar` / `voltar` — etapa ±1 (zera página e item); `ir_etapa` `valor: 1..N+1` (limitado)
  - `pagina` / `item` `valor: n` — referência da página da história / item da atividade
  - `encerrar` — fecha a roda; a missão fica concluída para quem participou (+XP da missão na primeira vez)
- `POST /rodas/{id}/duplas` `{ automatico: true }` ou `{ pares: [[a, b], ...] }` → `{ roda, duplas: DuplaEstado[] }`
  Refaz todas as duplas só com quem está na roda (presente). 422 para par repetido, criança fora da roda ou consigo mesma.

## App da criança (guard `crianca`, prefixo `/api/crianca`)

- `GET /roda` → `{ roda: { id, codigo, status, aula: { id, titulo, rotulo, palavra_geradora }, turma: { id, nome } } | null }`
  (roda aberta da própria turma, senão de uma turma amiga; a Galáxia consulta a cada 15 s e mostra "Roda aberta").
- `POST /rodas/entrar` `{ codigo? }` → `{ roda: RodaEstado, conteudo: ConteudoRoda, eu: crianca_id, dupla: DuplaEstado|null }`
  Sem `codigo`, entra na roda aberta da própria turma (ou de uma amiga). 404 se não há roda para ela.
- `GET /rodas/{id}` → mesmo pacote (só para quem já entrou; 403 senão; 404 se a roda não é da turma/amiga).
  Uma roda encerrada continua legível para quem participou (tela final).
- `POST /rodas/{id}/sair` → `{ ok: true }` (marca ausente; voltar a entrar marca presente).
- Dupla (etapa de `montar_palavras` ou atividade avaliada):
  - `POST /rodas/{id}/dupla/propor` `{ ...resposta do tipo }` (ex.: `{ silabas }`, `{ item, opcao }`) → `DuplaEstado`
    403 fora da vez; 409 se já há proposta esperando resposta; 422 sem dupla ou etapa que não é de responder.
  - `POST /rodas/{id}/dupla/responder` `{ aceitar: boolean }` → `DuplaEstado` — só o par (403 para quem propôs; 409 sem proposta).
    `aceitar=true` avalia para as duas crianças e devolve `tentativa.resultado`; `false` ("vamos mudar") não avalia nada.
    Nos dois casos a vez passa para a outra criança.
- Sozinha (sem dupla):
  - `POST /rodas/{id}/tentativas` `{ silabas }` → mesmo formato de `POST /aulas/{id}/tentativas`, com as peças da roda.
  - `POST /rodas/{id}/atividades/{ordem}/responder` `{ ...resposta }` → mesmo formato de `POST /aulas/{id}/atividades/{ordem}/responder`.
- `POST /rodas/{id}/producao` `{ palavras }` → mesmo formato do app individual.
- `POST /broadcasting/auth` → autorização do canal de presença (via `/api/crianca-proxy/broadcasting/auth`).

Front: `app/(crianca)/app/(logada)/roda/page.tsx` (`?codigo=` do QR), `components/crianca/roda/*`,
`hooks/use-roda-tempo-real.ts`, `services/roda.ts`, `types/Roda.ts`; painel em `app/(painel)/painel/rodas/*`.
Na criança, a proposta da dupla passa pelo mesmo `ProvedorEnvioResposta` das atividades: quem propõe
espera a resposta do par (snapshot `.dupla.atualizada` ou polling) e só então vê o feedback.
