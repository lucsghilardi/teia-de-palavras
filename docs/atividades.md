# Atividades — tipos e formato do `config`

Uma missão (`aulas`) é uma sequência de atividades (`aula_atividades`: `ordem`, `tipo`,
`titulo`, `instrucao`, `config` JSON, `imagem_path`). O `tipo` escolhe o **avaliador** no
backend (`App\Services\Atividades\RegistroAtividades`) e o componente no app da criança
(`frontend/components/crianca/atividades/registro.tsx`). Tipo novo = avaliador + componente.

Regras comuns:
- O CMS valida o `config` pelo avaliador (422 em `atividades.{i}.<campo>`), que devolve o config
  **normalizado** (ids gerados, opções completadas). É o normalizado que fica gravado.
- O que a criança recebe (`AulaCrianca.atividades[]`) **nunca** traz a resposta certa: opções e
  itens são embaralhados com semente determinística (criança + aula + atividade + dia) e têm
  `id` estável, não ligado à posição original.
- Tipos avaliados recebem `POST /crianca/aulas/{id}/atividades/{ordem}/responder` com
  `{ item, …resposta }` e respondem
  `{ correta, item, mensagem, dica, resposta_correta, xp_ganho, tentativas, resolvido,
  revisao_agendada, xp_total, nivel, conquistas, extra }`.
  - 1º erro: `dica` (sem `resposta_correta`). 2º erro do mesmo item: `resposta_correta` e
    `revisao_agendada: true`; o item conta como `resolvido` e a criança segue.
  - XP só no primeiro acerto de cada item (`config/teia.php` → `xp.atividade_item`).
  - `mensagem` e `dica` nunca dizem "errado"; podem ser faladas.
- `titulo` e `instrucao` são opcionais em todos os tipos (a instrução vira o texto do alto-falante).
- Ícones são nomes do lucide (`rocket`, `star`, `moon`, `package`…), sem emoji.

## Português (legados: leem as tabelas da aula)

| tipo | config | conteúdo para a criança | resposta |
|---|---|---|---|
| `historia` | `{}` (usa `aula_historia_paginas`) **ou** `{ "paginas": [ { "texto", "icone"? } ] }` (outras disciplinas) | `{ paginas: [ { texto, imagem_url, audio_url, icone? } ] }` | — |
| `conversa` | `{}` (usa `aula_perguntas`) **ou** `{ "perguntas": ["…"] }` | `{ perguntas: [ { texto, audio_url } ] }` | — |
| `palavra` | `{}` | `{ palavra, imagem_url, audio_url }` | — |
| `palmas` | `{}` | `{ silabas: [ { texto, audio_url } ] }` | — |
| `ficha` | `{}` | `{ linhas: [ { silaba, membros: [ { texto, audio_url } ] } ] }` | — |
| `montar_palavras` | `{ "minimo_palavras": 1 }` | `{ pecas, metas, teia_total, minimo_palavras }` | `{ silabas: ["TA","TU"] }` → `extra` = resposta de `/tentativas` |
| `frase` | `{ "minimo": 2 }` | `{ teia, palavrinhas, minimo }` | `{ palavras: ["O","TATU"] }` → `extra` = resposta de `/producao` |

## Genéricos (config em JSON; qualquer disciplina)

### `escolha` (e `verdadeiro_falso`)
```json
{ "itens": [ { "id": "q1", "pergunta": "quem subiu no teto?", "opcoes": ["o tatu", "a boneca", "o robô"],
               "correta": 0, "dica": "ouça de novo a página 3.", "explicacao": "foi o tatu.", "icone": "cat" } ],
  "embaralhar": true }
```
Criança: `{ itens: [ { id, pergunta, icone, opcoes: [ { id, texto } ] } ] }`. Resposta: `{ item: "q1", opcao: "<id>" }`.
`verdadeiro_falso`: `{ "itens": [ { "id"?, "frase": "…", "correta": true, "dica"?, "explicacao"? } ] }` → opções fixas
`verdadeiro`/`falso`.

### `ordenar` (e `linha_do_tempo`)
```json
{ "instrucao": "do primeiro ao último", "modo": "tempo",
  "itens": [ { "texto": "acordar", "icone": "sun" }, { "texto": "escovar os dentes" }, { "texto": "ir para a escola" } ],
  "dica": "o que você faz assim que abre os olhos?" }
```
A ordem do config é a correta (2–8 itens). Criança: `{ pergunta, modo, itens: [ { id, texto, icone } ] }`
embaralhados (nunca na ordem certa). Resposta: `{ item: "unico", ordem: ["<id>", …] }`.
`modo`: `sequencia` (padrão) | `tempo` (linha do tempo) | `numeros`.

### `parear`
```json
{ "instrucao": "ligue cada pessoa ao seu trabalho",
  "pares": [ { "a": "escola", "b": "estudar", "icone_a": "school", "icone_b": "book" }, { "a": "padaria", "b": "fazer pão" } ],
  "dica": "pense no que acontece em cada lugar." }
```
Criança: `{ pergunta, esquerda: [ { id, texto, icone } ], direita: [ { id, texto, icone } ] }` (colunas
embaralhadas). Resposta, **um par por vez**: `{ item: "<id da esquerda>", b: "<id da direita>" }`.

### `contar`
```json
{ "itens": [ { "id": "c1", "icone": "star", "quantidade": 14, "opcoes": [12, 14, 15] } ] }
```
`opcoes` é opcional (o avaliador gera 3 ao redor da quantidade). Criança: `{ itens: [ { id, icone,
quantidade, opcoes: [int] } ] }` (a quantidade é o que ela conta na tela, em grupos de 10).
Resposta: `{ item: "c1", valor: 14 }`.

### `somar_subtrair`
```json
{ "itens": [ { "a": 7, "b": 5, "operacao": "+" } ], "apoio": "icones", "opcoes": 3 }
```
ou gerado: `{ "gerar": { "quantidade": 5, "maximo": 20, "operacoes": ["+", "-"] }, "apoio": "reta" }`.
`apoio`: `icones` (concreto) | `reta` (pictórico) | `nenhum` (abstrato). Fatos gerados são estáveis
por criança e atividade. Criança: `{ apoio, itens: [ { id: "7+5", a, b, operacao, opcoes: [int] } ] }`.
Resposta: `{ item: "7+5", valor: 12 }` (o id carrega o fato; a conferência não depende do sorteio).
Dica gerada: "comece no 7 e conte mais 5: 8, 9, 10…".

### `escolher_silaba` (EF02LP02)
```json
{ "itens": [
  { "id": "e1", "modo": "completar", "palavra": "TATU", "silabas": ["TA","TU"], "oculta": 1, "opcoes": ["TU","TO","TE"] },
  { "id": "e2", "modo": "trocar", "de": "MOLA", "silabas": ["MO","LA"], "para": "MALA", "posicao": 0, "opcoes": ["MA","MO","LA"] } ] }
```
Criança: `{ itens: [ { id, modo, palavra e alvo (só em trocar), pecas: ["TA", null], posicao, opcoes } ] }`.
Resposta: `{ item: "e1", silaba: "TU" }`. A sílaba correta entra nas opções automaticamente.

### `dinheiro` (EF02MA20)
```json
{ "itens": [ { "id": "d1", "preco": 7, "moedas": [1, 1, 2, 5, 10], "dica": "..." } ] }
```
Valores em reais inteiros (1, 2, 5, 10, 20, 50, 100); o config só é aceito se alguma combinação
das moedas soma o preço. Criança: `{ itens: [ { id, preco, moedas: [ { id, valor } ] } ] }`.
Resposta: `{ item: "d1", escolhidas: ["m3", "m4"] }` (ids das moedas): qualquer combinação que
some o preço vale. Dica gerada: "você juntou 5; faltam 2 reais." / "passou 3 reais. tire uma moeda.".
`resposta_correta`: a combinação com menos moedas (`{ escolhidas, valores, preco }`).

### `mapa_pontos` (Geografia)
```json
{ "cenario": "bairro",
  "pontos": [ { "chave": "escola", "rotulo": "a escola", "icone": "school", "x": 0.74, "y": 0.25 } ],
  "perguntas": [ { "id": "p1", "alvo": "escola", "texto": "Onde fica a escola?", "dica": "..." } ] }
```
`cenario`: `bairro` | `escola` (desenhos do app em `frontend/public/cenarios/`); `x`/`y` são frações
da largura/altura. Criança: `{ cenario, pontos, itens: [ { id, texto } ] }` (sem o alvo); tocar num
ponto fala o rótulo. Resposta: `{ item: "p1", ponto: "escola" }`. `resposta_correta`: `{ ponto, rotulo }`.

### `ditado` (ouvir → montar)
```json
{ "itens": [ { "id": "d1", "palavra": "TETO", "silabas": ["TE", "TO"], "opcoes": ["TA", "TU"], "dica": "..." } ] }
```
`silabas` é opcional (o silabador separa); `opcoes` são os distratores (as sílabas certas entram
sozinhas). Criança: `{ itens: [ { id, audio_url, fala, tamanho, opcoes } ] }`: `audio_url` é a
gravação/áudio da palavra quando existe e `fala` é a palavra em minúsculas para a voz do navegador
(a tela nunca mostra `fala`). Resposta: `{ item: "d1", silabas: ["TE", "TO"] }`. Dica gerada: quantos
pedaços a palavra tem ou o primeiro pedaço. `resposta_correta`: `{ silabas, palavra }`.
