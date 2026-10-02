# Planeta Inglês: desenho

Data: 2026-10-02. Status: aprovado em conversa, aguardando revisão desta spec.

## Objetivo

Incluir Inglês como 5º planeta da Galáxia para o Gustavo (1º ano, 7 anos em outubro) e
crianças da mesma idade. O Inglês é um **extra lúdico e só oral**: a criança ouve palavras em
inglês e toca na imagem. A BNCC só traz Língua Inglesa a partir do 6º ano (EF06LI), então as
missões não citam habilidade.

**Sucesso:** o Gustavo completa as 4 missões só com toques e ouvindo; as palavras erradas voltam
na Revisão; nenhuma palavra em inglês aparece escrita; nada muda nos outros planetas.

## Decisões do usuário (não reabrir)

1. **Só oral.** Nenhuma palavra em inglês escrita na tela. A criança está se alfabetizando em
   português, e a grafia do inglês (*blue*, *one*) conflita com as regras de sílaba que ela está
   fixando.
2. **Inglês só no planeta Inglês.** A voz em inglês fala SÓ a palavra que se aprende, e só em
   aulas da disciplina `ingles`. Todo o resto (os outros 4 planetas e, dentro das aulas de
   Inglês, história, instruções, dicas e celebrações) continua em português, na voz neural do
   Google (`pt-BR-Chirp3-HD-Leda`).
3. **Voz por idioma (caminho A).** A palavra em inglês fica num campo próprio, nunca misturada
   numa frase em português. A marcação inline (`{en:hello}` dentro de frases) ficou de fora.
4. **Sem mini-aulas em Inglês** nesta entrega.

## Parte 1: voz por idioma

### Backend

- `config/teia.php` → `voz.vozes`: mapa idioma → nome da voz.
  - `pt-BR` → `env('TEIA_VOZ_NOME', 'pt-BR-Chirp3-HD-Leda')` (o que já existe em `voz.nome`;
    `voz.nome` continua valendo para não quebrar quem lê).
  - `en-US` → `env('TEIA_VOZ_NOME_EN', 'en-US-Chirp3-HD-Leda')`.
  - `voz.idiomas` = `['pt-BR', 'en-US']` (lista fechada).
- `VozService`:
  - `existente(string $texto, string $idioma = 'pt-BR')` e `gerar(string $texto, string $idioma = 'pt-BR')`.
  - `chave()` mantém a fórmula `provedor|voz|velocidade|texto`; a voz é a do idioma. Para
    `pt-BR` o hash é **byte a byte o mesmo de hoje** (as 752 MP3 em cache em produção seguem
    válidas). Como o nome da voz carrega o idioma, não há colisão entre `pt-BR` e `en-US`.
  - `normalizar()` não muda.
- `Sintetizador::sintetizar(string $texto, string $voz)` recebe a voz. `GoogleSintetizador`
  tira o `languageCode` dos dois primeiros segmentos do nome (`en-US-Chirp3-HD-Leda` → `en-US`)
  em vez do `pt-BR` fixo. `SintetizadorNulo` acompanha.
- `GET /crianca/voz?texto=…&idioma=en-US`: `idioma` é opcional; o padrão é `pt-BR` e o valor
  precisa estar em `voz.idiomas` (422 caso contrário). Chamadas sem `idioma` se comportam como
  hoje. `GET /api/vozes/{hash}.mp3` não muda.
- `ColetorDeFalas::coletar()` passa a devolver `list<array{texto: string, idioma: string}>`.
  As palavras de `vocabulario`/`ouvir_tocar` entram como `en-US` e as `traducao` como `pt-BR`;
  todo o resto é `pt-BR`, como hoje.
  `teia:gerar-vozes` passa o idioma ao `VozService`. `--so-contar` mostra a contagem por idioma.
- Teto de chars do mês e o teto pré-login não mudam (contam as duas línguas juntas).

### Front

- `lib/voz.ts`: `obterUrlDeVoz(texto, { idioma })` e `urlEmCache(texto, idioma)`. A chave do
  cache em memória é `idioma|texto` e a query leva `&idioma=` só quando não for `pt-BR`
  (as URLs em português ficam iguais às de hoje).
- `lib/fala.ts`: `falar(texto, { idioma })`, com padrão `pt-BR`. No Web Speech, usa
  `lang = idioma`, escolhe a melhor voz do aparelho para o idioma (mesma lógica de hoje para
  `pt-BR`, generalizada) e, sem voz do idioma, fala assim mesmo com `lang` definido.
- `falarSequencia([{ texto, idioma }…])` para "*cat*" → "gato" e "Ouça e toque:" → "*cat*",
  cancelável como as falas de hoje. Nunca bloqueia a tela esperando o áudio.

## Parte 2: atividades e conteúdo

### Item de vocabulário (formato comum)

```json
{ "palavra": "cat", "traducao": "gato", "icone": "cat" }
```

- `palavra`: inglês, minúsculas, 1–30 chars, falada em `en-US`. Nunca vai para a tela.
- `traducao`: português, falada em `pt-BR` (e é o rótulo acessível).
- A imagem é **exatamente um** destes campos: `icone` (lucide, no mapa de `lib/icones.ts`),
  `cor` (hex `#rrggbb`, amostra de cor) ou `numero` (1–10, algarismo + bolinhas). Algarismo é
  permitido: não é escrita em inglês.
- `id` é opcional; o avaliador gera `id` estável a partir de `palavra`.

### `vocabulario` (não avaliada)

Config: `{ "itens": [ <item>… ] }` (2–8 itens, `palavra` única na atividade).
Criança recebe `{ itens: [ { id, fala, idioma: "en-US", traducao, icone|cor|numero } ] }`.
Tela: grade de cartões ≥ 64 px só com a imagem. Tocar fala `palavra` (en-US) e depois
`traducao` (pt-BR), e o cartão fica marcado como ouvido. Continuar acende depois de ouvir todos.
Chegada narrada: "Toque em cada figura e ouça o nome em inglês."

### `ouvir_tocar` (avaliada)

Config: `{ "itens": [ <item>… ], "opcoes": 3, "dica"? }` (3–10 itens; `opcoes` 2–4, padrão 3).
O avaliador sorteia os distratores entre os outros itens da mesma atividade (semente
determinística, como os embaralhamentos de hoje) e grava as opções no config normalizado.
Criança: `{ itens: [ { id, fala, idioma: "en-US", opcoes: [ { id, traducao, icone|cor|numero } ] } ] }`
(a resposta não vem; o `fala` segue o precedente do `ditado`, nunca é mostrado).
Resposta: `{ item, opcao }`. Tela: na chegada, "Ouça e toque:" (pt-BR) e a palavra (en-US); o
alto-falante repete só a palavra; tocar numa opção fala a `traducao` dela (regra do leitor
iniciante).

Feedback (`RespostaService`, regras de sempre):
- 1º erro: `dica` continua sendo string em português (contrato de hoje): "Ouça de novo e toque
  na figura." + a `dica` do item, se houver. Para repetir a palavra, a resposta traz
  `extra.fala = { texto: <palavra>, idioma: "en-US" }`; o front fala a dica (pt-BR) e depois
  a palavra (en-US). A tela nunca mostra a palavra em inglês.
- 2º erro: `resposta_correta` = `{ opcao, traducao }`, e o item entra na revisão.
- XP só no primeiro acerto.

**Revisão:** a chave do item é `ingles:<palavra>`, então a mesma palavra em missões diferentes
é um item só. A revisão remonta um `ouvir_tocar` de um item com as opções gravadas.

### Regra "inglês só no planeta Inglês"

`vocabulario` e `ouvir_tocar` só são aceitos em aulas `disciplina = ingles`; fora disso o CMS
responde 422 em `atividades.{i}.tipo`. O `RegistroAtividades` ganha a noção de "tipos por
disciplina", e o editor do painel só oferece esses modelos em Inglês.

### Missões (seeder `ConteudoInglesSeeder`, fase 1, publicadas)

Universo: a nave Teia pousa no **Planeta Hello**, onde os robôs só falam inglês. A tripulação, e
a Gosma junto, aprende a conversar com eles. `historia` sempre em português.

| ordem | slug | palavras | sequência |
|---|---|---|---|
| 1 | `ingles-1-hello` | hello (`hand`), bye-bye (`door-open`), yes (`thumbs-up`), no (`thumbs-down`), thank you (`heart-handshake`) | historia → vocabulario → ouvir_tocar |
| 2 | `ingles-2-colors` | red, blue, yellow, green, orange, purple (`cor`) | historia → vocabulario → ouvir_tocar → ouvir_tocar (mistura com a missão 1) |
| 3 | `ingles-3-numbers` | one … ten (`numero`) | idem (mistura com cores) |
| 4 | `ingles-4-animals` | cat, dog, bird, fish, rabbit, turtle (ícones de mesmo nome) | idem (mistura com números) |

Na "mistura", as palavras de missões anteriores voltam como itens. Na prática a revisão as
traz de qualquer forma, mas a mistura dá a sensação de acumular, como as famílias silábicas.

## Parte 3: integração

- `App\Enums\Disciplina::Ingles = 'ingles'`; `config/disciplinas.php` → nome "Inglês",
  cor `#f472b6`, ícone `languages`, ordem 5, `tem_palavra_geradora` false, descrição
  "Ouvir e reconhecer palavras em inglês: cumprimentos, cores, números e animais."
- Front: `lib/disciplinas.ts` (espelho), união `Disciplina` em `types/CriancaApp.ts`,
  `--c-ingles` em `globals.css`, ícones novos em `lib/icones.ts` (`languages`, `hand`,
  `door-open`, `thumbs-up`, `thumbs-down`, `heart-handshake`, `cat`, `dog`, `bird`, `fish`,
  `rabbit`, `turtle`; os que já estiverem no mapa ficam como estão), grupo `ingles` no catálogo de ilustrações (vazio por ora; capas caem no ícone).
- Galáxia com 5 planetas: conferir a grade (número ímpar) e o E2E de rolagem lateral, em
  tablet e celular.
- `ModelosMiniAula`: o `match` ganha `Disciplina::Ingles => []`, e o front esconde "gravar
  mini-aula" quando não há modelo.
- Missões do dia e Roda: Inglês entra como as outras disciplinas, sem prioridade especial.
- Conquista `planeta_ingles_1` "Pouso em Inglês" (`icone` `languages`), em
  `config/conquistas.php` e `GamificacaoCrianca`.
- Painel: `modelos-atividade.ts` ganha `vocabulario` e `ouvir_tocar` (só `ingles`). O
  progresso no painel mostra o planeta novo, sempre sem comparação.
- Documentação no mesmo commit: `docs/atividades.md` (2 tipos), `docs/api-crianca.md`
  (`idioma` em `/crianca/voz`, formato dos tipos), `docs/api-painel.md` (422 da regra de
  disciplina), `docs/metodos.md` (linha "Inglês oral" e por que sem escrita), `CLAUDE.md`
  (regra "inglês só no planeta Inglês"; missão semeada de Inglês), `README.md` (fases).

## Testes

- **Pest, voz:** o hash `pt-BR` de uma frase conhecida é igual ao de antes (valor fixo no
  teste); `idioma=xx` → 422; `idioma=en-US` usa `TEIA_VOZ_NOME_EN` e `languageCode` en-US (HTTP
  fake); sem `idioma` = comportamento atual; o coletor devolve palavras en-US e traduções pt-BR.
- **Pest, atividades:** `vocabulario` e `ouvir_tocar` (config válido e normalizado; 0 ou 2
  imagens → 422; `palavra` repetida → 422; payload da criança sem resposta; distratores
  determinísticos; 1º erro com dica; 2º erro com resposta e revisão; XP só no 1º acerto; chave
  `ingles:<palavra>`; revisão remonta o item); tipo de Inglês em aula de Português → 422.
- **Pest, integração:** a Galáxia lista 5 planetas; a medalha `planeta_ingles_1`; modelos de
  mini-aula vazios para Inglês; o seeder cria as 4 missões encadeadas.
- **Vitest:** `voz.ts` (chave com idioma, query só para não-pt-BR) e `fala.ts` (lang e
  escolha de voz por idioma, `falarSequencia` cancelável).
- **Playwright:** missão `ingles-1-hello` só com toques em tablet e celular, sem rolagem
  lateral, botões ≥ 64 px e nenhuma palavra inglesa no texto visível da página.

## Produção (só quando o usuário pedir)

1. `pg_dump` em produção.
2. Push em `main` (o auto-deploy roda `deploy.sh` com o build; não há migration: `aulas.disciplina`
   e `crianca_itens.disciplina` são `string(20)` sem restrição).
3. `teia:reaplicar-conteudo --todas` **sem** `--forcar` (só cria as aulas que faltam).
4. Adicionar `TEIA_VOZ_NOME_EN` ao `.env` de produção, se diferente do padrão (o arquivo
   pertence ao uid 33; depois, `deploy.sh`).
5. `teia:gerar-vozes --todas --so-contar` e depois uma única execução de `teia:gerar-vozes`
   em um só ambiente.
6. Abrir a missão 1 de Inglês no tablet do Gustavo.

## Fora do escopo

- Escrita em inglês na tela, inglês dentro de frases (`{en:…}`) e mini-aulas em Inglês.
- Ilustrações desenhadas do Planeta Hello (capas caem no ícone).
- Gravação da voz da criança em inglês.
