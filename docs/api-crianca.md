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
- `OpcaoVisual = { chave, rotulo, emoji, imagem_url|null }`.
- `Conquista = { chave, titulo, descricao, emoji }`.

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
{ id, apelido, avatar: OpcaoVisual, usa_minusculas,
  turma: { id, nome },
  estrelas, sequencia_dias, teia_total,
  config: { heroi_nome, fabrica_nome, minutos_pausa } }
```

`POST /crianca/sair` → 200 (via Next: `POST /api/crianca-auth/logout`).

`POST /crianca/sessao/pulso` `{}` → 200 `{ sessao_id, minutos, sugerir_pausa }`
- Chamar a cada 60 s enquanto a página estiver visível.
- `sugerir_pausa` vem `true` **uma única vez** por sessão, quando `minutos >= minutos_pausa`.
- Mais de 10 min sem pulso encerra a sessão; o próximo pulso abre outra.

## Mapa

`GET /crianca/mapa` → 200
```
{ missoes: [ { id, titulo, fase, ordem, palavra_geradora, palavra_imagem_url,
               status: "disponivel"|"em_andamento"|"concluida"|"bloqueada",
               etapa_atual: 1..8|null } ] }        // só aulas publicadas, na ordem
```

## Aula

`GET /crianca/aulas/{id}` → 200 `AulaCrianca` (não muda o progresso). 403 se trancada.
`POST /crianca/aulas/{id}/iniciar` → 200 `AulaCrianca` (marca em andamento; idempotente). 403 se trancada.

```
AulaCrianca = {
  id, titulo, fase, palavra_geradora, palavra_imagem_url, palavra_audio_url,
  status, etapa_atual,                      // 1..8; concluída continua 8 (pode rever)
  etapas: ["missao","conversa","palavra","palmas","ficha","criacao","producao","conquista"],
  historia:  [ { texto, imagem_url, audio_url } ],
  perguntas: [ { texto, audio_url } ],
  palmas:    [ { texto, audio_url } ],       // sílabas da palavra geradora, em ordem
  ficha:     [ { silaba, membros: [ { texto, audio_url } ] } ],   // uma linha por palma
  pecas:     [ { texto, audio_url, da_aula } ],   // sílabas acumuladas p/ Criação; da_aula primeiro
  metas:     [ { palavra, silabas, imagem_url, audio_url, encontrada } ],  // dicionário da aula
  teia:      [ { palavra, audio_url } ],     // palavras da Teia da criança (peças da Produção)
  palavrinhas: ["O","A","E","É","UM","UMA","NO","NA","DO","DA","TEM","COM"]
}
```

`POST /crianca/aulas/{id}/etapas/{n}/concluir` → 200 `{ etapa_atual }`
- Conclui a etapa `n` (1..7) e avança para `n+1`. Repetir uma etapa já passada é ok (não volta).
- 422 `{ message }` se `n` > `etapa_atual` (não pula etapas). 403 se trancada.

`POST /crianca/aulas/{id}/tentativas` `{ silabas: ["TA","TU"] }` → 200
```
{ valida, tipo: "valida"|"quase"|"aguardando_aprovacao"|"desconhecida"|"silaba_indisponivel",
  palavra|null, silabas, nova_na_teia, dica|null, audio_url|null,
  teia_total, estrelas, conquistas: Conquista[] }      // conquistas recém-desbloqueadas
```
Palavra válida e nova entra na Teia e vale 1 estrela. Repetida não duplica.

`POST /crianca/aulas/{id}/producao` `{ palavras: ["O","TATU","TEM","TETO"] }` → 200
`{ texto, estrelas, conquistas }`. 422 `{ message }` com menos de 2 palavras.

`POST /crianca/aulas/{id}/concluir` → 200
```
{ desbloqueadas: [ { id, titulo, palavra_geradora } ],
  estrelas, conquistas: Conquista[],
  palavras_da_missao: [ { palavra, audio_url } ] }   // descobertas nesta aula
```
422 se a criança ainda não chegou na etapa 8. Concluir de novo não dá estrelas extras.

## Teia de Palavras

`GET /crianca/teia` → 200
```
{ total, palavras: [ { palavra, silabas, aula: { id, titulo }|null, descoberta_em,
                       audio_url, imagem_url } ] }     // mais recentes primeiro
```
