# API do painel (Fase 1) — contrato

Base: `/api/painel/*`, guard `api` (adulto), middleware `panel.active`.
Todas as respostas são JSON. Erros de validação: 422 `{message, errors:{campo:[...]}}`.
Datas em ISO 8601. Listagens sem paginação nesta fase (volumes pequenos).

Papéis: `admin` vê tudo. `educador` vê só as turmas que criou e as crianças
dessas turmas. Aulas, dicionário e configurações são globais: qualquer adulto
edita. `/painel/users` continua só admin.

## Opções visuais (avatares e figuras secretas)
- `GET /painel/opcoes-visuais` → `{ avatares: OpcaoVisual[], figuras: OpcaoVisual[] }`
  - `OpcaoVisual = { chave, rotulo, emoji, icone|null, cor|null, imagem_url|null }` (só ativas, na ordem; avatares são a tripulação espacial, os bichinhos antigos ficam inativos)

## Turmas
- `GET /painel/turmas` → `Turma[]`
- `POST /painel/turmas` `{nome}` → 201 `Turma`
- `GET /painel/turmas/{id}` → `Turma & { criancas: CriancaResumo[] }`
- `PUT /painel/turmas/{id}` `{nome, ativa}` → `Turma`
- `POST /painel/turmas/{id}/novo-codigo` → `Turma` (gera outro código de 6 caracteres)
- `DELETE /painel/turmas/{id}` → 204 (só sem crianças; senão 422)
- `Turma = { id, nome, codigo, ativa, educador: {id, name}, total_criancas, created_at }`
- `CriancaResumo = { id, apelido, avatar: OpcaoVisual, usa_minusculas, narracao_automatica }`

## Crianças
- `GET /painel/criancas?turma_id=` → `Crianca[]`
- `POST /painel/criancas` → 201 `Crianca`
  ```
  { turma_id, apelido, avatar_chave, figura_secreta_chave, usa_minusculas?, narracao_automatica?,
    consentimento: { aceito: true, versao_texto: "v1" } }
  ```
  - `consentimento.aceito` obrigatório e `true`; grava `consentimentos` com o user logado e o IP.
  - `apelido` único na turma (2–40 chars). Nenhum outro dado pessoal é aceito.
- `GET /painel/criancas/{id}` → `Crianca`
- `PUT /painel/criancas/{id}` `{apelido, avatar_chave, usa_minusculas, narracao_automatica, turma_id}` → `Crianca`
- `POST /painel/criancas/{id}/figura-secreta` `{figura_secreta_chave}` → `Crianca` (redefine e desbloqueia)
- `POST /painel/criancas/{id}/solicitar-exclusao` → `Crianca` (marca `exclusao_solicitada_em`)
- `DELETE /painel/criancas/{id}` → 204 (soft delete; áudios são apagados por job — Fase 4)
- `Crianca = { id, apelido, avatar: OpcaoVisual, usa_minusculas, narracao_automatica, turma: {id, nome, codigo},
    responsavel: {id, name}, bloqueada_ate|null, exclusao_solicitada_em|null,
    consentimento: {versao_texto, aceito_em}|null, created_at }`

## Aulas (CMS)
Cada aula pertence a uma **disciplina** (`portugues` | `matematica` | `geografia` | `historia`; lista em
`config/disciplinas.php`) e é uma sequência de **atividades** (`aula_atividades`). Em Português a aula
também tem palavra geradora, sílabas, famílias, história, conversa e dicionário, que as atividades
legadas (`historia`, `conversa`, `palavra`, `palmas`, `ficha`, `montar_palavras`, `frase`) leem.
Os tipos de atividade e o formato do `config` de cada um estão em `docs/atividades.md`.

- `GET /painel/aulas?disciplina=` → `AulaResumo[]` ordenado por disciplina (ordem dos planetas), `fase, ordem`
  - `AulaResumo = { id, slug, disciplina, titulo, rotulo, descricao, habilidade_bncc, fase, ordem,
      palavra_geradora|null, status, pre_requisito_aula_id, palavra_imagem_url|null,
      totais: {silabas, palavras, paginas, perguntas, atividades}, updated_at }`
  - `rotulo` é o que o nó do mapa mostra: o cadastrado, senão a palavra geradora, senão o título.
- `POST /painel/aulas` `{titulo, disciplina?, palavra_geradora, fase, rotulo?, descricao?, habilidade_bncc?}` → 201 `Aula`
  (rascunho; slug e ordem gerados por disciplina+fase; pré-requisito = última aula da disciplina).
  `disciplina` padrão `portugues`. `palavra_geradora` é obrigatória só em Português (sílabas/famílias
  sugeridas automaticamente); nas outras disciplinas é ignorada. Português nasce com a sequência legada
  de 7 atividades; as outras disciplinas nascem sem atividades.
- `GET /painel/aulas/{id}` → `Aula`
- `PUT /painel/aulas/{id}` → `Aula` (documento completo; filhos são sincronizados). A disciplina não muda.
  ```
  { titulo, palavra_geradora, fase, pre_requisito_aula_id|null, rotulo?, descricao?, habilidade_bncc?,
    silabas: [ { texto: "TE", familia: ["TA","TE","TI","TO","TU"] }, ... ],   // só Português
    historia_paginas: [ { id?, texto } ],          // só Português; ordem = posição; imagem/áudio via /midia
    perguntas: [ { id?, texto } ],                 // só Português
    palavras: [ { id?, palavra: "TATU", silabas: ["TA","TU"], destaque: true } ],   // só Português
    atividades?: [ { id?, tipo, titulo?, instrucao?, config? } ] }   // ordem = posição; imagem via /midia
  ```
  - Em Português `silabas`, `historia_paginas`, `perguntas` e `palavras` são obrigatórios (`present`);
    nas outras disciplinas são ignorados e o documento pode trazer só `atividades`.
  - `atividades` ausente mantém as atuais (e garante a sequência padrão se a aula não tiver nenhuma).
    Com `id` atualiza (mantendo a imagem), sem `id` cria, ausentes são apagadas. `tipo` precisa existir
    no registro e `config` é validado pelo avaliador do tipo (422 em `atividades.{i}.tipo|config`).
- `POST /painel/aulas/{id}/publicar` → `Aula` (422 se faltar: ≥1 atividade; em Português também ≥1 sílaba,
  ≥1 página, ≥1 palavra)
- `POST /painel/aulas/{id}/despublicar` → `Aula`
- `PUT /painel/aulas/reordenar` `{ ordem: [aula_id, ...] }` → `AulaResumo[]` (reordena dentro da mesma disciplina e fase)
- `DELETE /painel/aulas/{id}` → 204 (só rascunho sem progresso de criança; senão 422)
- `POST /painel/aulas/{id}/midia` multipart `{ alvo: "palavra_imagem"|"palavra_audio"|"pagina_imagem"|"pagina_audio"|"pergunta_audio"|"palavra_dicionario_imagem"|"palavra_dicionario_audio"|"atividade_imagem", alvo_id?, arquivo }`
  → `{ url }` (imagem: jpg/png/webp ≤ 5 MB; áudio: mp3/m4a/ogg/webm/wav ≤ 10 MB; disco público)
- `DELETE /painel/aulas/{id}/midia` `{ alvo, alvo_id? }` → 204
- `POST /painel/silabas/sugerir-familia` `{silaba: "TE"}` → `{ familia: ["TA","TE","TI","TO","TU"] }`
- `Aula = { id, slug, disciplina, titulo, rotulo|null, descricao|null, habilidade_bncc|null, fase, ordem, status,
    palavra_geradora|null, palavra_imagem_url, palavra_audio_url, pre_requisito_aula_id, criada_por: {id,name},
    silabas: [ { id, texto, ordem, audio_url, familia: [ {id, texto, audio_url} ] } ],
    historia_paginas: [ { id, ordem, texto, imagem_url, audio_url } ],
    perguntas: [ { id, ordem, texto, audio_url } ],
    palavras: [ { id, palavra, silabas: [...], destaque, imagem_url, audio_url } ],
    atividades: [ { id, ordem, tipo, titulo, instrucao, config, imagem_url, avaliada } ],
    created_at, updated_at }`

## Dicionário geral
- `GET /painel/dicionario?busca=&aprovada=` → `Palavra[]`
- `POST /painel/dicionario` `{palavra, silabas: [...]}` → 201 `Palavra` (aprovada = true, origem = cms)
- `POST /painel/dicionario/importar` `{ texto: "CASA CA-SA\nBOLA BO-LA" }` → `{ importadas: number, ignoradas: [ { linha, motivo } ] }`
- `PUT /painel/dicionario/{id}` `{palavra, silabas, aprovada}` → `Palavra`
- `DELETE /painel/dicionario/{id}` → 204
- `Palavra = { id, palavra, palavra_normalizada, silabas, origem, aprovada, aprovada_em, created_at }`

## Configurações
- `GET /painel/configuracoes` → `{ heroi_nome, fabrica_nome, minutos_pausa, consentimento_versao, consentimento_texto }`
- `PUT /painel/configuracoes` (mesmos campos) → idem

## Regras que o backend garante
- Palavras são comparadas sem acento e em caixa alta (`palavra_normalizada`), mas exibidas como cadastradas.
- Famílias acumulam entre aulas: `FamiliasService::disponiveisPara(crianca, aula)`.
- Desbloqueio: aula disponível se publicada e sem pré-requisito, ou com pré-requisito concluído.
- Progresso: `crianca_aulas.etapa_atual` vai de 1 a N+1, em que N é o número de atividades e N+1 é a tela de conquista.
