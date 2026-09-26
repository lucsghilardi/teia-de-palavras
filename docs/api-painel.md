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
- `DELETE /painel/criancas/{id}` → 204 (soft delete; mini-aulas e entregas somem na hora, o áudio na limpeza diária)
- `Crianca = { id, apelido, avatar: OpcaoVisual, usa_minusculas, narracao_automatica, turma: {id, nome, codigo},
    responsavel: {id, name}, bloqueada_ate|null, exclusao_solicitada_em|null,
    consentimento: {versao_texto, aceito_em}|null, created_at }`

## Aulas (CMS)
Cada aula pertence a uma **disciplina** (`portugues` | `matematica` | `geografia` | `historia`; lista em
`config/disciplinas.php`) e é uma sequência de **atividades** (`aula_atividades`). Em Português a aula
também tem palavra geradora, sílabas, famílias, história, conversa e dicionário, que as atividades
legadas (`historia`, `conversa`, `palavra`, `palmas`, `ficha`, `montar_palavras`, `frase`) leem.
Aula nova de Português nasce com `historia, conversa, palavra, ficha, montar_palavras, frase`
(`AtividadesPadrao::PORTUGUES`); as missões semeadas usam `historia, escolha, palavra, ficha,
montar_palavras, escolher_silaba, ditado, frase`. Para reaplicar o conteúdo semeado num banco antigo:
`php artisan teia:reaplicar-conteudo --todas --forcar` (sem `--forcar` só lista).
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

## Amizades entre turmas
Duas turmas (casas) ficam amigas quando o responsável A gera um código e o responsável B aceita
com o termo (`amizade_termo_*` das configurações). Só com a amizade **aceita** as mini-aulas e os
áudios circulam entre as duas; qualquer lado encerra e as entregas trocadas somem. O código tem 8
caracteres, uso único, vale 7 dias (`teia.mini_aulas.amizade_dias`). Educador vê as amizades das
próprias turmas; admin vê todas.

- `GET /painel/amizades` → `{ termo: { versao, texto }, amizades: Amizade[] }`
- `POST /painel/amizades` `{ turma_id }` → 201 `Amizade` (pendente, com `codigo`; só o dono da turma)
- `POST /painel/amizades/aceitar` `{ turma_id, codigo, termo_aceito: true }` → `Amizade` aceita.
  422 em `codigo` (inválido, usado, vencido ou turmas já amigas), `turma_id` (a própria turma) ou
  `termo_aceito` (falso).
- `DELETE /painel/amizades/{id}` → `Amizade` encerrada (apaga as entregas de mini-aulas entre as duas turmas)
- `Amizade = { id, status: "pendente"|"aceita"|"encerrada"|"vencida", codigo|null (só para quem gerou,
    enquanto vale), turma: {id, nome}, turma_amiga: {id, nome}|null, gerada_por_mim, termo_versao,
    expira_em, aceita_em, encerrada_em, created_at }` — `turma` é sempre a do lado de quem consulta.

## Mini-aulas (fila do adulto)
Uma mini-aula = um desafio de um item (gerado de uma missão, `docs/atividades.md`) + o áudio da
criança (disco privado `local`, nunca público). Nasce `pendente` e só chega às crianças da turma da
autora e das turmas amigas depois de **aprovada**. Recusar apaga o arquivo. Educador vê as das
próprias turmas; admin todas.

- `GET /painel/mini-aulas?status=pendente|aprovada|recusada` → `MiniAula[]` (mais novas primeiro, até 100)
- `POST /painel/mini-aulas/{id}/aprovar` → `MiniAula` (aprova gravação + mini-aula, gera as entregas,
  dá XP à autora e a medalha `professor_1`)
- `POST /painel/mini-aulas/{id}/recusar` `{ motivo? }` → `MiniAula` (apaga o áudio e as entregas)
- `GET /painel/mini-aulas/{id}/audio` → o áudio (Content-Type pela extensão gravada; 404 se recusada)
- 403 se a autora não é de uma turma do educador.
- `MiniAula = { id, status, disciplina, tipo, titulo, config, autor: { id, apelido, avatar: OpcaoVisual, turma: {id, nome} }|null,
    aula_origem: { id, titulo, rotulo }|null, audio_url|null, duracao_ms, entregas, respondidas, motivo_recusa,
    revisada_por, revisada_em, created_at }` — `config` traz a resposta certa (o adulto pode conferir).

Limpeza (LGPD): `php artisan teia:limpar-gravacoes --dias=7` (agendado todo dia às 03:10) apaga do
disco os áudios recusados/removidos há mais de N dias e os de crianças excluídas.

## Configurações
- `GET /painel/configuracoes` → `{ heroi_nome, fabrica_nome, minutos_pausa, consentimento_versao, consentimento_texto,
  amizade_termo_versao, amizade_termo_texto }`
- `PUT /painel/configuracoes` (mesmos campos; os do termo de amizade são opcionais) → idem

## Regras que o backend garante
- Palavras são comparadas sem acento e em caixa alta (`palavra_normalizada`), mas exibidas como cadastradas.
- Famílias acumulam entre aulas: `FamiliasService::disponiveisPara(crianca, aula)`.
- Desbloqueio: aula disponível se publicada e sem pré-requisito, ou com pré-requisito concluído.
- Progresso: `crianca_aulas.etapa_atual` vai de 1 a N+1, em que N é o número de atividades e N+1 é a tela de conquista.
