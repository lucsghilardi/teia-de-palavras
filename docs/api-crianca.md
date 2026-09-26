# API da criança (Fase 2) — contrato

Backend: `/api/crianca/*`, guard JWT `crianca`.
Frontend: o navegador chama **`/api/crianca-proxy/<caminho>`**, que o Next
repassa para `/api/crianca/<caminho>` injetando o Bearer do cookie httpOnly
`teia_crianca` (e renovando no 401). Login e saída usam rotas próprias do Next:
`POST /api/crianca-auth/login` e `POST /api/crianca-auth/logout`.

Regras gerais:
- Respostas JSON sem envelope `data`. Erros: `{ message }` (+ `errors` em 422).
- **Nenhuma mensagem para a criança diz "errado"**; `message` e `dica` já vêm
  em linguagem gentil e podem ser faladas em voz alta.
- `*_audio_url` pode ser `null`: o front fala o texto com a Web Speech API pt-BR.
  Prioridade já resolvida no backend: gravação aprovada > áudio da aula > null.
- Textos de história/perguntas já chegam com `{{heroi}}`/`{{fabrica}}` trocados.
- `OpcaoVisual = { chave, rotulo, emoji, icone|null, cor|null, imagem_url|null }` (o app desenha `icone` do lucide sobre `cor`; `emoji` é só reserva textual).
- `Conquista = { chave, titulo, descricao, emoji, icone }` (`icone` é um nome do lucide; o front não usa o emoji).

## Entrada (públicas, sem token)

`GET /crianca/turma/{codigo}` → 200
```
{ turma: { nome, codigo },
  criancas: [ { id, apelido, avatar: OpcaoVisual } ],   // ordem alfabética
  figuras: OpcaoVisual[] }                               // sempre 9, ordem fixa (grade 3×3)
```
404 `{ message: "Não achei essa turma..." }` se o código não existe ou a turma está inativa.

`POST /crianca/login` `{ codigo_turma, crianca_id, figura_chave }`
- 200 `{ access_token, token_type, expires_in }` (8 h). **Via Next:** `POST /api/crianca-auth/login`
  com o mesmo corpo → 200 `{ authenticated: true }` e grava o cookie.
- 422 `{ message: "Hmm, não é essa figura. Vamos tentar de novo?", tentativas_restantes }`
- 423 `{ message: "Vamos chamar um adulto para ajudar?", bloqueada_ate }` (após 5 erros, 15 min)
- 429 teto de tentativas por minuto.

`POST /crianca/refresh` (Bearer vencido) → mesmo formato do login (uso interno do proxy).

## Sessão e perfil (Bearer da criança)

`GET /crianca/eu` → 200
```
{ id, apelido, avatar: OpcaoVisual,
  usa_minusculas,                             // "texto como escrito": caso natural e peças em minúsculas (padrão true)
  narracao_automatica,                        // fala história/instrução ao chegar na tela (padrão true)
  turma: { id, nome },
  xp, nivel, xp_no_nivel, xp_para_proximo,    // nível pela tabela config('teia.niveis'); último nível → xp_para_proximo null
  sequencia_dias, maior_sequencia, teia_total,
  medalhas_total, revisao_devidos,            // medalhas ganhas; itens da Revisão vencidos hoje
  config: { heroi_nome, fabrica_nome, minutos_pausa } }
```

`POST /crianca/sair` → 200 (via Next: `POST /api/crianca-auth/logout`).

`POST /crianca/sessao/pulso` `{}` → 200 `{ sessao_id, minutos, sugerir_pausa }`
- Chamar a cada 60 s enquanto a página estiver visível.
- `sugerir_pausa` vem `true` **uma única vez** por sessão, quando `minutos >= minutos_pausa`.
- Mais de 10 min sem pulso encerra a sessão; o próximo pulso abre outra.

## Galáxia

`GET /crianca/galaxia` → 200
```
{ planetas: [ { chave, nome, cor, icone, ordem, tem_palavra_geradora, descricao,   // sempre os 4, na ordem
                publicadas, concluidas, em_andamento,
                proxima: Missao|null } ],                 // a em andamento, senão a primeira disponível
  escolhas_do_dia: Missao[],                              // até 3, uma por planeta; o planeta parado há mais tempo primeiro
  revisao: { devidos },
  amigos: { novas } }                                     // Fase 7; por ora 0
```
`Missao` é o mesmo item de `GET /crianca/mapa`.

## Mapa (trilha de um planeta)

`GET /crianca/mapa?disciplina=` → 200
```
{ missoes: [ { id, titulo, descricao, disciplina, rotulo, fase, ordem, palavra_geradora|null, palavra_imagem_url,
               status: "disponivel"|"em_andamento"|"concluida"|"bloqueada",
               etapa_atual: 1..N+1|null, total_atividades: N } ] }   // só aulas publicadas, na ordem
```
- `disciplina` (`portugues|matematica|geografia|historia`) filtra um planeta; sem ela vêm todas, na
  ordem disciplina → fase → ordem. `rotulo` é o que o nó do mapa mostra.
- `etapa_atual` vai de 1 a `N+1`: `N` é o número de atividades e `N+1` é a tela de conquista.

## Aula

`GET /crianca/aulas/{id}` → 200 `AulaCrianca` (não muda o progresso). 403 se trancada.
`POST /crianca/aulas/{id}/iniciar` → 200 `AulaCrianca` (marca em andamento; idempotente). 403 se trancada.

```
AulaCrianca = {
  id, titulo, descricao, disciplina, rotulo, fase,
  palavra_geradora|null, palavra_imagem_url, palavra_audio_url,
  status, etapa_atual,                      // 1..N+1; concluída continua N+1 (pode rever)
  total_atividades,                         // N
  etapas: [ ...tipos das atividades, "conquista" ],   // compatibilidade; use `atividades`
  atividades: [ { ordem, tipo, titulo, instrucao, imagem_url, avaliada, ...conteudo do tipo } ],
  // Conteúdo por tipo (docs/atividades.md), sem nunca trazer a resposta certa:
  //   historia → { paginas }        conversa → { perguntas }      palavra → { palavra, imagem_url, audio_url }
  //   palmas → { silabas }          ficha → { linhas }
  //   montar_palavras → { pecas: [ { texto, audio_url, da_aula } ], metas: [ { palavra, silabas, imagem_url, audio_url, encontrada } ],
  //                       teia_total, minimo_palavras }
  //   frase → { teia: [ { palavra, audio_url } ], palavrinhas: [...], minimo }
  // Nada de Português fica solto no topo: tudo vive na atividade que usa.
}
```

`POST /crianca/aulas/{id}/etapas/{n}/concluir` → 200 `{ etapa_atual }`
- Conclui a atividade `n` (1..N) e avança para `n+1`. Repetir uma etapa já passada é ok (não volta).
- 422 `{ message }` se `n` > `etapa_atual` (não pula etapas) ou `n` > N. 403 se trancada.

`POST /crianca/aulas/{id}/atividades/{n}/responder` `{ item?, ...resposta do tipo }` → 200
```
{ correta, item, mensagem, dica|null, resposta_correta|null, xp_ganho, extra, xp_total, nivel }
```
- Só para atividades com `avaliada: true` (422 nas outras; 404 se `n` não existe; 403 se trancada).
- O corpo depende do tipo (`docs/atividades.md`). Nos tipos legados de Português, `extra` traz a
  resposta completa da tentativa (`montar_palavras` → mesmo formato de `/tentativas`;
  `frase` → mesmo formato de `/producao`).
- `mensagem` e `dica` nunca dizem "errado" e podem ser faladas.

`POST /crianca/aulas/{id}/tentativas` `{ silabas: ["TA","TU"] }` → 200
```
{ valida, tipo: "valida"|"quase"|"aguardando_aprovacao"|"desconhecida"|"silaba_indisponivel",
  palavra|null, silabas, nova_na_teia, dica|null, audio_url|null,
  teia_total, xp_total, conquistas: Conquista[] }      // conquistas recém-desbloqueadas
```
Palavra válida e nova entra na Teia e vale 1 estrela. Repetida não duplica.

`POST /crianca/aulas/{id}/producao` `{ palavras: ["O","TATU","TEM","TETO"] }` → 200
`{ texto, xp_total, conquistas }`. 422 `{ message }` com menos de 2 palavras.

`POST /crianca/aulas/{id}/concluir` → 200
```
{ desbloqueadas: [ { id, titulo, palavra_geradora } ],
  xp_total, conquistas: Conquista[],
  palavras_da_missao: [ { palavra, audio_url } ] }   // descobertas nesta aula
```
422 se a criança ainda não chegou na etapa N+1. Concluir de novo não dá XP extra.

## Revisão espaçada

Toda atividade avaliada gera *itens* na fila de revisão da criança (caixas de Leitner:
acerto sobe uma caixa e afasta a próxima data; erro volta para a caixa 0 e marca para
amanhã). Intervalos, tamanho da sessão e a caixa "dominada" em `config/teia.php` (`revisao`).

`GET /crianca/revisao` → 200
```
{ devidos,                                   // quantos itens venceram (hoje ou antes)
  itens: [ { id, disciplina, chave, caixa,
             atividade: Atividade } ] }      // até 6, caixa mais baixa primeiro; atividade de UM item,
                                             // no mesmo formato de AulaCrianca.atividades (sem a resposta)
```

`POST /crianca/revisao/{item}/responder` `{ item?, ...resposta do tipo }` → 200
```
{ correta, item, mensagem, dica|null, resposta_correta|null, xp_ganho, tentativas: 1, resolvido: true,
  revisao_agendada, extra, caixa, proxima_revisao_em, xp_total, nivel, conquistas: Conquista[] }
```
- Na revisão a resposta certa aparece já no primeiro erro (é treino, não prova); `xp_ganho` = 1 no acerto.
- 404 se o item não é da criança.

## Medalhas

`GET /crianca/medalhas` → 200
```
{ total, desbloqueadas,
  medalhas: [ { chave, titulo, descricao, emoji, icone, desbloqueada_em|null } ] }   // todas, na ordem do config
```
Só o próprio caminho da criança: nunca há ranking nem comparação.

## Base dos amigos (mini-aulas)

Aprender ensinando: a criança escolhe um **modelo** (desafio de um item gerado da missão) e grava a
voz explicando; ela nunca digita. A aula fica `pendente` até um adulto aprovar no painel; depois é
**entregue** às crianças da mesma turma e das turmas amigas (amizade aceita pelos dois responsáveis).
De um amigo a criança só vê apelido e avatar. Reações são fixas (`valeu`, `aprendi`, `top`): não há
texto livre entre crianças. Limites em `config/teia.php` (`mini_aulas`): 10 por dia, 60 s, 2 MB,
mimes webm/mp4/m4a/ogg/mp3/wav.

`GET /crianca/mini-aulas/modelos?aula_id=&semente=` → 200
```
{ aula: { id, titulo, rotulo, disciplina }, semente,
  modelos: [ { chave, tipo, titulo, fala } ],     // até 3; `fala` é o que o app diz ao tocar
  limite_segundos }
```
404 se a missão está trancada para a criança. Outra `semente` sorteia outros modelos ("outro").

`POST /crianca/mini-aulas` multipart `{ aula_id, modelo (chave), semente, duracao_ms?, audio }` → 201
```
{ id, status: "pendente", titulo, mensagem }      // "Sua aula foi para um adulto olhar..."
```
422 em `audio` (tipo/tamanho ou teto diário), `duracao_ms` (longa demais), `modelo` (não existe mais).
O modelo é regenerado no servidor a partir da chave: o corpo da criança nunca define o desafio.

`GET /crianca/mini-aulas/minhas` → 200 `{ mini_aulas: [ { id, titulo, disciplina, tipo, status, respondidas, reacoes: {valeu?, aprendi?, top?}, created_at } ] }`
(quantos amigos responderam, nunca quem nem quem foi melhor)

`GET /crianca/mini-aulas/recebidas` → 200
```
{ novas,                                           // entregas ainda não respondidas
  entregas: [ { id, status: "recebida"|"respondida", correta|null, reacao|null,
                mini_aula: { id, titulo, disciplina, tipo, autor: { apelido, avatar: OpcaoVisual },
                             audio_url, created_at } } ] }   // novas primeiro; só mini-aulas aprovadas
```
`audio_url` é `/api/crianca-proxy/audios/{id}`: `GET /crianca/audios/{gravacao}` serve o áudio só a
crianças da mesma turma ou de turma amiga, só se aprovado (404 nos outros casos).

`GET /crianca/mini-aulas/entregas/{id}` → 200 `{ ...entrega, atividade: Atividade }` (desafio montado
como as atividades da missão, sem a resposta). 404 se não é da criança ou a aula não está aprovada.

`POST /crianca/mini-aulas/entregas/{id}/responder` `{ item?, ...resposta do tipo }` → 200 — mesmo
formato e política de `atividades/{ordem}/responder`: dica no 1º erro, resposta no 2º (item vai para a
Revisão), XP só no primeiro acerto. A autora ganha XP por amigo que acerta, com teto por mini-aula.

`POST /crianca/mini-aulas/entregas/{id}/reagir` `{ reacao: "valeu"|"aprendi"|"top" }` → 200 entrega.

`GET /crianca/galaxia` traz `amigos.novas` com a mesma contagem de `recebidas.novas`.

## Teia de Palavras

`GET /crianca/teia` → 200
```
{ total, palavras: [ { palavra, silabas, aula: { id, titulo }|null, descoberta_em,
                       audio_url, imagem_url } ] }     // mais recentes primeiro
```
