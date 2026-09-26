# Métodos: por que o app é assim

O Teia de Palavras nasceu do método de Paulo Freire (palavras geradoras) para
alfabetizar. Ao crescer para crianças de 7+ e para quatro disciplinas, o produto
passou a se apoiar em outros métodos com evidência forte. Este documento liga cada
decisão de produto ao método que a sustenta, para quem quiser criar conteúdo ou
mudar regras sem perder o fio.

| Método (evidência) | O que vira no produto |
|---|---|
| **Palavras geradoras** (Freire) + **consciência fonológica** (PNA 2019) | Português continua partindo de UMA palavra geradora por missão; sílabas geram famílias (TE → TA TE TI TO TU) que acumulam entre missões; palavra descoberta entra na Teia. `escolher_silaba` (completar/trocar sílaba, EF02LP02) treina a manipulação de sílabas. As palmas saíram da sequência padrão (ficam no editor). |
| **Prática de recuperação + espaçamento** (Roediger & Karpicke; guia AERO *Spacing and retrieval practice*) | Toda atividade avaliada gera *itens* numa fila de Leitner por criança (`crianca_itens`); a Revisão diária traz até 6 itens vencidos, os de caixa mais baixa primeiro. Acerto sobe a caixa (1, 3, 7, 14, 30 dias); erro volta para a caixa 0, amanhã. As perguntas de compreensão da história (`escolha`) substituem a conversa aberta como recuperação ativa. |
| **Feedback formativo sem punição** (Hattie & Timperley; Dweck) | Nunca "errado", nota ou ranking. 1º erro: mensagem curta + dica específica. 2º erro do mesmo item: a resposta certa com explicação, e o item entra na revisão. XP só no primeiro acerto de cada item (não recompensa tentativa e erro). |
| **Maestria** (Bloom; Khan Academy) | Nenhuma missão trava por nota. A maestria mora na Revisão: o item é "dominado" na caixa 4. Cada atividade avaliada mostra a resposta no 2º erro, então a criança sempre segue. |
| **CPA: concreto → pictórico → abstrato** (Singapore Math; NIE) | `contar` mostra objetos em fileiras de 10; `somar_subtrair` tem apoio `icones` (concreto), `reta` (pictórico) ou `nenhum` (abstrato). As missões de Matemática vão do concreto ao símbolo. |
| **Teoria da autodeterminação** (Ryan & Deci; Ryan, Rigby & Przybylski 2006, SDT em jogos) | Autonomia: a Galáxia oferece até 3 "missões do dia" e quatro planetas para escolher. Competência: XP, nível, barra e medalhas visíveis, sempre só da própria criança. Relacionamento: base dos amigos (mini-aulas e duplas, Fases 7 e 8). |
| **Aprender ensinando / efeito protégé** (Chase, Chin, Oppezzo & Schwartz 2009; meta-análises 2024–25 de *learning by teaching* e *cross-age tutoring*) | Mini-aulas gravadas por modelos prontos (a criança escolhe e grava, nunca digita) e duplas ao vivo com papéis alternados; medalhas de "professor(a)". Programas estruturados rendem mais, por isso os modelos são fechados. (Fases 7 e 8.) |
| **Design de jogos educativos** (metanálises de *game-based learning*; NN/g sobre cognição infantil) | Um objetivo e um CTA por tela; feedback imediato; missões de 5–8 min com convite de pausa; instrução curta visível + alto-falante em toda tela; botões ≥ 64 px; ícones consistentes por tipo de atividade. |
| **Fluência de leitura** (fonte Lexend; texto como escrito) | O app da criança usa Lexend. `usa_minusculas` = "texto como escrito": frases em caso natural e peças em minúsculas por padrão (7+, 2º ano); caixa alta continua disponível por criança para leitores iniciantes. |
| **BNCC 2º ano** | Cada missão nova cita `habilidade_bncc`: Matemática EF02MA01/04/05/20; Geografia EF02GE01/04/08/10; História EF02HI01/03/06/10; Português EF02LP02. |

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
