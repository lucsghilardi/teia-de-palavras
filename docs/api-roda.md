# Modo turma: a Roda (Fase 3) — contrato

A **Roda** é o círculo de cultura: o educador conduz uma missão com a turma
inteira ao mesmo tempo. Cada criança usa o próprio dispositivo (já logada no
app); a tela do educador pode ir para o projetor.

- Tabela `turma_sessoes` (model `TurmaSessao`), participantes, duplas e tentativas da dupla.
- Uma turma tem no máximo **uma roda aberta** (status `aguardando` ou `em_andamento`).
- Tempo real: Laravel Reverb, **um canal de presença por roda**: `presence-roda.{id}`
  (no Echo: `echo.join("roda.{id}")`). Autoriza o educador da turma (ou admin) e as crianças da turma.
  - Membro educador: `{ id: "e{userId}", tipo: "educador", nome }`
  - Membro criança: `{ id: "c{criancaId}", tipo: "crianca", crianca_id, apelido, emoji }`
- Eventos (nomes com ponto no `listen`, pois usam `broadcastAs`):
  - `.roda.atualizada` → payload `RodaEstado` (snapshot completo; substitua o estado local).
  - `.dupla.atualizada` → payload `DuplaEstado` (cada criança filtra pela própria dupla).
- Ao (re)conectar, o cliente busca o snapshot pela API. Sem websocket, faça polling a cada 5 s.
- Autorização do canal:
  - educador: `POST /api/proxy/broadcasting/auth` (já existe, `lib/echo.ts`);
  - criança: `POST /api/crianca-proxy/broadcasting/auth` (→ `/api/crianca/broadcasting/auth`).

## Tipos

```
RodaEstado = {
  id, codigo,                       // código de 6 caracteres (vira QR: /app/roda?codigo=XXXXXX)
  status: "aguardando"|"em_andamento"|"encerrada",
  etapa_atual: 1..8,                // mesma ordem do app individual (missao..conquista)
  estado: { pagina: number, pergunta: number },   // página da história / pergunta da conversa (0-based)
  crianca_mestre_id: number|null,   // criança-mestre: conduz a leitura e a conversa
  aula: { id, titulo, palavra_geradora },
  turma: { id, nome },
  participantes: [ { id, apelido, avatar: OpcaoVisual|null } ],   // entraram na roda (ordem de chegada)
  duplas: [ { id, crianca_a_id, crianca_b_id } ]
}

DuplaEstado = {
  id, roda_id,
  criancas: [ { id, apelido, avatar } ],   // [a, b]
  vez_de: number,                          // criança que PROPÕE agora (alterna após cada resposta)
  tentativa: null | {
    id, silabas: string[], proposta_por: number,
    status: "proposta"|"confirmada"|"recusada",
    valida: boolean|null, palavra: string|null, dica: string|null
  },
  palavras: [ { palavra, audio_url } ]     // descobertas pela dupla nesta roda
}

ConteudoRoda = AulaCrianca (mesmo formato do docs/api-crianca.md), com:
  - pecas: sílabas liberadas pela missão da roda e por todas as missões anteriores
    (a turma inteira usa as mesmas peças);
  - metas[].encontrada / teia: da criança que pediu (no painel: encontrada = false, teia = []).
```

## Painel (educador, guard `api`, prefixo `/api/painel`)

- `GET /rodas` → `RodaEstado[]` das turmas do educador (abertas primeiro, depois as 10 últimas encerradas).
- `POST /rodas` `{ turma_id, aula_id }` → 201 `RodaEstado` (status `aguardando`).
  422 se a turma já tem roda aberta (`message` + `roda_id` da aberta). A aula precisa estar publicada.
- `GET /rodas/{id}` → `{ roda: RodaEstado, conteudo: ConteudoRoda, criancas_da_turma: [ { id, apelido, avatar } ], duplas: DuplaEstado[] }`
- `POST /rodas/{id}/comandos` `{ acao, valor? }` → `RodaEstado` (e transmite `.roda.atualizada`)
  - `iniciar` — sai de `aguardando`, vai para a etapa 1
  - `avancar` / `voltar` — etapa +1 / −1 (zera página e pergunta)
  - `ir_etapa` `valor: 1..8`
  - `pagina` `valor: n` — página da história; `pergunta` `valor: n` — pergunta da conversa
  - `mestre` `valor: crianca_id|null` — escolhe (ou tira) a criança-mestre (precisa ter entrado na roda)
  - `encerrar` — fecha a roda; a missão fica **concluída para quem participou** (+3 estrelas na primeira vez)
- `POST /rodas/{id}/duplas` `{ pares: [[a, b], ...] }` ou `{ automatico: true }` → `{ roda: RodaEstado, duplas: DuplaEstado[] }`
  Refaz as duplas só com quem entrou na roda. No automático, quem sobra fica sem dupla (brinca sozinho).

## App da criança (guard `crianca`, prefixo `/api/crianca`)

- `GET /roda` → `{ roda: { id, codigo, status, aula: { id, titulo, palavra_geradora } } | null }`
  (roda aberta da turma da criança; o mapa consulta a cada 15 s e mostra "Entrar na roda").
- `POST /rodas/entrar` `{ codigo? }` → `{ roda: RodaEstado, conteudo: ConteudoRoda, eu: crianca_id, dupla: DuplaEstado|null }`
  Sem `codigo`, entra na roda aberta da própria turma. 404 `{ message }` se não houver / código de outra turma.
- `GET /rodas/{id}` → mesmo formato do `entrar` (só para quem já entrou; 403 senão).
- `POST /rodas/{id}/sair` → 200.
- `POST /rodas/{id}/mestre` `{ acao: "proxima"|"anterior" }` → `RodaEstado`.
  Só a criança-mestre; muda a página (etapa 1) ou a pergunta (etapa 2). 403 para as outras.
- Dupla (etapa 6, criação):
  - `POST /rodas/{id}/dupla/propor` `{ silabas }` → `DuplaEstado` — só quem tem a vez; 409 se já há proposta esperando resposta.
  - `POST /rodas/{id}/dupla/responder` `{ aceitar: boolean }` → `DuplaEstado` — só o parceiro.
    `aceitar=true` valida a palavra: válida entra na Teia **das duas crianças** (origem `dupla`, 1 estrela
    para cada, medalha "Ajudou um amigo"); inválida volta com `dica` gentil. `aceitar=false` ("vamos mudar")
    não valida nada. Em ambos os casos a vez passa para a outra criança.
- Sozinha (sem dupla) na etapa 6: `POST /rodas/{id}/tentativas` `{ silabas }` → mesmo formato de
  `POST /aulas/{id}/tentativas` do app individual, usando as peças da roda.
- Produção (etapa 7): `POST /rodas/{id}/producao` `{ palavras }` → mesmo formato do app individual.
- `POST /broadcasting/auth` → autorização do canal de presença (via `/api/crianca-proxy/broadcasting/auth`).
