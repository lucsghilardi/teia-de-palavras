# Métodos: por que o app é assim

O Teia de Palavras nasceu do método de Paulo Freire (palavras geradoras) para
alfabetizar. É feito para crianças a partir do 1º ano (6+) e cobre quatro
disciplinas; por isso se apoia também em outros métodos com evidência forte. Este documento liga cada
decisão de produto ao método que a sustenta, para quem quiser criar conteúdo ou
mudar regras sem perder o fio.

| Método (evidência) | O que vira no produto |
|---|---|
| **Palavras geradoras** (Freire) + **consciência fonológica** (PNA 2019) | Português continua partindo de UMA palavra geradora por missão; sílabas geram famílias (TE → TA TE TI TO TU) que acumulam entre missões; palavra descoberta entra na Teia. `escolher_silaba` (completar/trocar sílaba, EF01LP08/EF01LP09) treina a relação entre a sílaba falada e a escrita; trocar sílaba já prepara o EF02LP02. As palmas saíram da sequência padrão (ficam no editor). |
| **Prática de recuperação + espaçamento** (Roediger & Karpicke; guia AERO *Spacing and retrieval practice*) | Toda atividade avaliada gera *itens* numa fila de Leitner por criança (`crianca_itens`); a Revisão diária traz até 6 itens vencidos, os de caixa mais baixa primeiro. Acerto sobe a caixa (1, 3, 7, 14, 30 dias); erro volta para a caixa 0, amanhã. As perguntas de compreensão da história (`escolha`) substituem a conversa aberta como recuperação ativa. |
| **Feedback formativo sem punição** (Hattie & Timperley; Dweck) | Nunca "errado", nota ou ranking. 1º erro: mensagem curta + dica específica. 2º erro do mesmo item: a resposta certa com explicação, e o item entra na revisão. XP só no primeiro acerto de cada item (não recompensa tentativa e erro). |
| **Maestria** (Bloom; Khan Academy) | Nenhuma missão trava por nota. A maestria mora na Revisão: o item é "dominado" na caixa 4. Cada atividade avaliada mostra a resposta no 2º erro, então a criança sempre segue. |
| **CPA: concreto → pictórico → abstrato** (Singapore Math; NIE) | `contar` mostra objetos em fileiras de 10; `somar_subtrair` tem apoio `icones` (concreto), `reta` (pictórico) ou `nenhum` (abstrato). A primeira missão de Matemática fica nos fatos até 10 com objetos na tela (juntar e tirar); a reta e os números até 100 vêm depois. |
| **Teoria da autodeterminação** (Ryan & Deci; Ryan, Rigby & Przybylski 2006, SDT em jogos) | Autonomia: a Galáxia oferece até 3 "missões do dia" e quatro planetas para escolher. Competência: XP, nível, barra e medalhas visíveis, sempre só da própria criança. Relacionamento: base dos amigos (mini-aulas e duplas, Fases 7 e 8). |
| **Aprender ensinando / efeito protégé** (Chase, Chin, Oppezzo & Schwartz 2009; meta-análises 2024–25 de *learning by teaching* e *cross-age tutoring*) | Mini-aulas gravadas por modelos prontos (a criança escolhe e grava, nunca digita) e duplas ao vivo com papéis alternados; medalhas de "professor(a)". Programas estruturados rendem mais, por isso os modelos são fechados. (Fases 7 e 8.) |
| **Design de jogos educativos** (metanálises de *game-based learning*; NN/g sobre cognição infantil) | Um objetivo e um CTA por tela; feedback imediato; missões de 5–8 min com convite de pausa; instrução curta visível + alto-falante em toda tela; botões ≥ 64 px; ícones consistentes por tipo de atividade. |
| **Leitor iniciante** (1º ano; PNA 2019) | A criança de 6 anos ainda está aprendendo a ler, então nada depende só de ler: na múltipla escolha a chegada lê a pergunta e cada opção (a opção lida acende) e o alto-falante repete pergunta + opções; em ordenar e parear, tocar num item fala o nome dele (à direita do parear, sem nada escolhido, tocar só faz ouvir). Instruções de Matemática dizem "ouça", não "leia". |
| **Fluência de leitura** (fonte Lexend; letra de imprensa maiúscula) | O app da criança usa Lexend. Criança nova começa em caixa alta (letra de imprensa maiúscula, como no início do 1º ano). `usa_minusculas` = "texto como escrito" (frases em caso natural e peças em minúsculas) se liga por criança no painel quando ela já lê em minúsculas. |
| **Tempo de tela** | Convite de pausa depois de 15 minutos seguidos (`minutos_pausa`, ajustável no painel). |
| **BNCC 1º ano** | Cada missão cita `habilidade_bncc` da própria disciplina: Português EF01LP08; Matemática EF01MA08 (juntar e tirar até 10), EF01MA04 (contar até 100), EF01MA07 (dezenas e unidades), EF01MA19 (moedas e cédulas), EF01MA05 (comparar números), EF01MA13 (cubo, esfera, cilindro e cone), EF01MA17 (dias da semana e partes do dia); Geografia EF01GE01 (lugares de vivência), EF01GE08 (caminho e mapa), EF01GE09 (referenciais com o corpo), EF01GE07 (trabalho no campo e na cidade), EF01GE05 (dia e noite), EF01GE10 (chuva, sol e vento; a roupa para cada tempo toca o EF01GE11), EF01GE04 (regras de convívio na escola), EF01GE03 (praças e parques); História EF01HI01 (tempo vivido e linha do tempo), EF01HI02 (família), EF01HI06 (papel de cada pessoa na comunidade), EF01HI05 (brincadeiras de ontem e de hoje), EF01HI04 (casa e escola), EF01HI03 (papéis e responsabilidades), EF01HI08 (festas e comemorações). A Fase 2 de cada planeta (missões 5 a 8) fecha o arco da Gosma. |

## Onde cada coisa vive

- Política de feedback: `App\Services\Atividades\RespostaService` e `config/teia.php`
  (`tentativas_ate_resposta`, `xp`, `niveis`, `revisao`).
- Revisão espaçada: `App\Services\Revisao\{Leitner,RevisaoService}` e `GET/POST /crianca/revisao`.
- Tipos de atividade e formato do conteúdo: `docs/atividades.md`.
- Conteúdo semeado: `database/seeders/Conteudo{Inicial,Matematica,Geografia,Historia}Seeder.php`
  (reaplicar em bancos antigos: `php artisan teia:reaplicar-conteudo --todas --forcar`).
- Galáxia e escolhas do dia: `App\Services\Galaxia\GalaxiaService`.

## Fontes

- Freire, P. *Educação como prática da liberdade* (1967); *A importância do ato de ler* (1981).
- Brasil. *Política Nacional de Alfabetização* (PNA), 2019; *Base Nacional Comum Curricular* (BNCC), 2017.
- Roediger, H. L.; Karpicke, J. D. "Test-enhanced learning". *Psychological Science*, 2006.
- AERO (Australian Education Research Organisation). *Spacing and retrieval practice*, 2023.
- Hattie, J.; Timperley, H. "The power of feedback". *Review of Educational Research*, 2007.
- Bloom, B. S. "Learning for mastery". *Evaluation Comment*, 1968.
- Ministry of Education Singapore / NIE. *Concrete-Pictorial-Abstract approach*.
- Ryan, R. M.; Deci, E. L. *Self-Determination Theory*, 2017; Ryan, Rigby & Przybylski, *Motivation and Emotion*, 2006.
- Chase, C. C.; Chin, D. B.; Oppezzo, M. A.; Schwartz, D. L. "Teachable agents and the protégé effect". *Journal of Science Education and Technology*, 2009.
- Kobayashi, K. "Learning by teaching" (meta-análise). *Educational Psychology Review*, 2024/2025.
- Nielsen Norman Group. *Children's UX: usability issues in designing for young people*, 2019.
