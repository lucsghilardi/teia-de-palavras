<?php

namespace Database\Seeders;

use App\Services\Conteudo\AplicadorConteudo;
use Illuminate\Database\Seeder;

/**
 * As 10 missões de Português, no universo da nave Teia (7+). Personagens
 * ORIGINAIS e editáveis: o capitão {{heroi}} e a oficina/base {{fabrica}},
 * nomes definidos em Configurações. Tom de aventura, nunca terror.
 *
 * Cada missão: história (3 páginas), perguntas de compreensão (escolha),
 * palavra geradora, ficha de descoberta, montar palavras, escolher sílaba
 * (EF02LP02), ditado (ouvir → montar) e frase. As palavras-meta e as famílias silábicas são as mesmas
 * da primeira versão (a progressão fonológica não mudou).
 *
 * Fase 1 (sílabas simples) entra publicada. Fase 2 (sílabas complexas) entra
 * como rascunho para o educador revisar no CMS.
 *
 * Idempotente: aula que já existe (pelo slug) não é tocada, para não apagar
 * edições feitas no CMS. Para reaplicar em bancos antigos:
 * `php artisan teia:reaplicar-conteudo --todas --forcar`.
 */
class ConteudoInicialSeeder extends Seeder
{
    public const SEQUENCIA = ['historia', 'escolha', 'palavra', 'ficha', 'montar_palavras', 'escolher_silaba', 'ditado', 'frase'];

    public function run(AplicadorConteudo $aplicador): void
    {
        $aplicador->aplicarLista(self::missoes());
    }

    /** @return list<array<string, mixed>> */
    public static function missoes(): array
    {
        return array_map(fn (array $m) => self::comAtividades($m), self::dados());
    }

    /**
     * Monta a sequência de atividades a partir dos blocos legíveis do seeder.
     *
     * @param  array<string, mixed>  $m
     * @return array<string, mixed>
     */
    private static function comAtividades(array $m): array
    {
        $m['disciplina'] = 'portugues';
        $m['atividades'] = [
            ['tipo' => 'historia', 'config' => []],
            ['tipo' => 'escolha', 'titulo' => 'Você entendeu?', 'instrucao' => 'Toque na resposta certa.', 'config' => ['itens' => $m['escolha'], 'embaralhar' => true]],
            ['tipo' => 'palavra', 'config' => []],
            ['tipo' => 'ficha', 'config' => []],
            ['tipo' => 'montar_palavras', 'config' => []],
            ['tipo' => 'escolher_silaba', 'titulo' => 'Qual sílaba?', 'instrucao' => 'Toque na sílaba certa.', 'config' => ['itens' => $m['silabas_desafio']]],
            ['tipo' => 'ditado', 'titulo' => 'Ditado', 'instrucao' => 'Ouça a palavra e monte com as peças.', 'config' => ['itens' => array_map(fn ($d) => ['palavra' => $d[0], 'silabas' => $d[1], 'opcoes' => $d[2]], $m['ditado'])]],
            ['tipo' => 'frase', 'config' => []],
        ];

        unset($m['escolha'], $m['silabas_desafio'], $m['ditado']);

        return $m;
    }

    /**
     * @param  list<string>  $opcoes
     * @return array<string, mixed>
     */
    private static function pergunta(string $pergunta, array $opcoes, string $dica, string $explicacao, ?string $icone = null): array
    {
        return ['pergunta' => $pergunta, 'opcoes' => $opcoes, 'correta' => 0, 'dica' => $dica, 'explicacao' => $explicacao, 'icone' => $icone];
    }

    /** @return list<array<string, mixed>> */
    private static function dados(): array
    {
        return [
            [
                'slug' => 'missao-1-a-teia-do-bairro', 'titulo' => 'Missão 1: A nave Teia',
                'descricao' => 'A rede de energia da nave salva um robô tatu preso no teto da base.',
                'habilidade_bncc' => 'EF02LP02',
                'fase' => 1, 'ordem' => 1, 'palavra' => 'TEIA', 'publicar' => true,
                'silabas' => [['TEI'], ['A']],
                'historia' => [
                    '{{heroi}} é o capitão da nave Teia. A nave tem esse nome por causa da rede de energia que ela lança no espaço: uma teia que segura tudo o que passa perto.',
                    'Hoje a base {{fabrica}} mandou um alerta: um robô tatu subiu no teto da estação para consertar uma antena e ficou preso lá em cima.',
                    '{{heroi}} lançou a teia como uma ponte. O tatu desceu devagar, sem pressa. A tia e o tio que cuidam da base agradeceram: — Valeu, capitão!',
                ],
                'perguntas' => [
                    'Quem ajuda as pessoas no lugar onde você mora?',
                    'Você já ajudou alguém? Como foi?',
                    'O que dá para fazer quando alguém precisa de ajuda?',
                ],
                'escolha' => [
                    self::pergunta('Por que a nave se chama Teia?', ['Por causa da rede de energia que ela lança', 'Porque é feita de fios', 'Porque é pequena'], 'Ouça a primeira página de novo.', 'A teia é a rede de energia da nave.', 'rocket'),
                    self::pergunta('Quem ficou preso no teto da estação?', ['Um robô tatu', 'O capitão', 'A tia'], 'Ele subiu para consertar uma antena.', 'Foi o robô tatu.', 'bot'),
                ],
                'silabas_desafio' => [
                    ['modo' => 'completar', 'palavra' => 'TATU', 'silabas' => ['TA', 'TU'], 'oculta' => 1, 'opcoes' => ['TU', 'TO', 'TE'], 'dica' => 'ta... tu. Qual pedaço falta no fim?'],
                    ['modo' => 'completar', 'palavra' => 'TETO', 'silabas' => ['TE', 'TO'], 'oculta' => 0, 'opcoes' => ['TE', 'TA', 'TI'], 'dica' => 'A palavra começa com te.'],
                    ['modo' => 'trocar', 'de' => 'TIA', 'silabas' => ['TI', 'A'], 'para' => 'TIO', 'posicao' => 1, 'opcoes' => ['O', 'A', 'E'], 'dica' => 'Troque só o último pedaço.'],
                ],
                'ditado' => [['TATU', ['TA', 'TU'], ['TO', 'TE']], ['TETO', ['TE', 'TO'], ['TA', 'TI']]],
                'palavras' => [['TEIA', true], 'TATU', 'TIA', 'TIO', 'TETO'],
            ],
            [
                'slug' => 'missao-2-a-boneca-perdida', 'titulo' => 'Missão 2: A boneca-robô',
                'descricao' => 'Uma boneca-robô perdeu o boné na oficina e a tripulação ajuda a achar.',
                'habilidade_bncc' => 'EF02LP02',
                'fase' => 1, 'ordem' => 2, 'palavra' => 'BONECA', 'publicar' => true,
                'silabas' => [['BO'], ['NE'], ['CA']],
                'historia' => [
                    'Numa noite de lua, {{heroi}} viu uma luz piscando na oficina {{fabrica}}, onde os robôs são montados.',
                    'Num canto, uma boneca-robô estava sozinha. Tinha perdido o boné vermelho e não conseguia falar: a boca só piscava.',
                    '{{heroi}} procurou com ela. O boné estava dentro de um cubo de metal, atrás de um cano. A boneca abriu um sorriso de orelha a orelha.',
                ],
                'perguntas' => [
                    'Como você acha que a boneca se sentiu sozinha?',
                    'O que você faz quando perde alguma coisa importante?',
                    'Como dá para ajudar um amigo que está triste?',
                ],
                'escolha' => [
                    self::pergunta('Onde estava o boné da boneca?', ['Dentro de um cubo de metal', 'No teto da nave', 'Na lua'], 'Foi atrás de um cano.', 'O boné estava dentro de um cubo de metal.', 'package'),
                    self::pergunta('O que a boneca tinha perdido?', ['O boné vermelho', 'A boca', 'O cubo'], 'Era vermelho.', 'Ela tinha perdido o boné vermelho.', 'bot'),
                ],
                'silabas_desafio' => [
                    ['modo' => 'completar', 'palavra' => 'BONECA', 'silabas' => ['BO', 'NE', 'CA'], 'oculta' => 1, 'opcoes' => ['NE', 'NA', 'NO'], 'dica' => 'bo... ne... ca.'],
                    ['modo' => 'completar', 'palavra' => 'BOCA', 'silabas' => ['BO', 'CA'], 'oculta' => 0, 'opcoes' => ['BO', 'BA', 'BE'], 'dica' => 'A palavra começa com bo.'],
                    ['modo' => 'trocar', 'de' => 'CANO', 'silabas' => ['CA', 'NO'], 'para' => 'CABO', 'posicao' => 1, 'opcoes' => ['BO', 'NO', 'CO'], 'dica' => 'Troque o último pedaço.'],
                ],
                'ditado' => [['BOCA', ['BO', 'CA'], ['NE', 'CO']], ['CUBO', ['CU', 'BO'], ['CA', 'BA']]],
                'palavras' => [['BONECA', true], 'BOCA', 'BONÉ', 'CUBO', 'CANO', 'NABO'],
            ],
            [
                'slug' => 'missao-3-o-pulo-certeiro', 'titulo' => 'Missão 3: O pulo na lua',
                'descricao' => 'Na gravidade fraca da lua, um pulo certeiro resgata a pipa de sinalização.',
                'habilidade_bncc' => 'EF02LP02',
                'fase' => 1, 'ordem' => 3, 'palavra' => 'PULO', 'publicar' => true,
                'silabas' => [['PU'], ['LO']],
                'historia' => [
                    'Na lua, a gravidade é fraca: cada passo vira um pulo enorme. A tripulação da nave Teia foi treinar no campo de pouso.',
                    'Uma pipa de sinalização ficou presa na antena mais alta. {{heroi}} olhou com a lupa: o chão estava livre? Estava.',
                    'Com um pulo certeiro, ele pegou a pipa sem tocar na antena. Depois todo mundo dividiu um saco de pipoca na base {{fabrica}}.',
                ],
                'perguntas' => [
                    'Por que é importante olhar antes de pular?',
                    'O que você já viu que fica preso no alto?',
                    'Qual brincadeira você mais gosta de fazer ao ar livre?',
                ],
                'escolha' => [
                    self::pergunta('Por que na lua cada passo vira um pulo?', ['A gravidade é fraca', 'O chão é mole', 'Tem muito vento'], 'Ouça a primeira página.', 'Na lua a gravidade é fraca.', 'moon'),
                    self::pergunta('O que ficou preso na antena?', ['Uma pipa', 'Uma lupa', 'Um saco de pipoca'], 'Era de sinalização.', 'Uma pipa ficou presa na antena.', 'telescope'),
                ],
                'silabas_desafio' => [
                    ['modo' => 'completar', 'palavra' => 'PULO', 'silabas' => ['PU', 'LO'], 'oculta' => 1, 'opcoes' => ['LO', 'LA', 'LU'], 'dica' => 'pu... lo.'],
                    ['modo' => 'completar', 'palavra' => 'PIPA', 'silabas' => ['PI', 'PA'], 'oculta' => 0, 'opcoes' => ['PI', 'PA', 'PU'], 'dica' => 'A palavra começa com pi.'],
                    ['modo' => 'trocar', 'de' => 'LUPA', 'silabas' => ['LU', 'PA'], 'para' => 'LULA', 'posicao' => 1, 'opcoes' => ['LA', 'PA', 'PO'], 'dica' => 'Troque o último pedaço.'],
                ],
                'ditado' => [['PIPA', ['PI', 'PA'], ['PU', 'PO']], ['LUPA', ['LU', 'PA'], ['LO', 'PU']]],
                'palavras' => [['PULO', true], 'PIPA', 'LUPA', 'LULA', 'PIPOCA'],
            ],
            [
                'slug' => 'missao-4-a-mola-do-robo', 'titulo' => 'Missão 4: A mola do robô',
                'descricao' => 'O robô de manutenção parou de pular: falta uma mola, e a engenheira sabe onde achar.',
                'habilidade_bncc' => 'EF02LP02',
                'fase' => 1, 'ordem' => 4, 'palavra' => 'MOLA', 'publicar' => true,
                'silabas' => [['MO'], ['LA']],
                'historia' => [
                    'Na oficina {{fabrica}}, o robô de manutenção parou de pular. Estava faltando uma mola.',
                    '{{heroi}} foi conhecer quem trabalha lá: a engenheira Lila, que monta as peças com as próprias mãos. Ela abriu uma mala cheia de molas.',
                    'Juntos, eles encaixaram a mola. Boing! O robô pulou tão alto que quase bateu no teto.',
                ],
                'perguntas' => [
                    'Quem conserta as coisas na sua casa?',
                    'Que trabalho você gostaria de fazer quando crescer?',
                    'Como dá para cuidar das coisas que alguém fez com trabalho?',
                ],
                'escolha' => [
                    self::pergunta('O que estava faltando no robô?', ['Uma mola', 'Uma mala', 'Uma cama'], 'Sem ela, o robô não pula.', 'Faltava uma mola.', 'bot'),
                    self::pergunta('Quem monta as peças na oficina?', ['A engenheira Lila', 'O robô tatu', 'A boneca'], 'Ela abriu uma mala cheia de molas.', 'A engenheira Lila monta as peças.', 'wrench'),
                ],
                'silabas_desafio' => [
                    ['modo' => 'completar', 'palavra' => 'MOLA', 'silabas' => ['MO', 'LA'], 'oculta' => 0, 'opcoes' => ['MO', 'MA', 'ME'], 'dica' => 'A palavra começa com mo.'],
                    ['modo' => 'trocar', 'de' => 'MOLA', 'silabas' => ['MO', 'LA'], 'para' => 'MALA', 'posicao' => 0, 'opcoes' => ['MA', 'ME', 'MU'], 'dica' => 'Troque o primeiro pedaço.'],
                    ['modo' => 'completar', 'palavra' => 'CAMA', 'silabas' => ['CA', 'MA'], 'oculta' => 1, 'opcoes' => ['MA', 'MO', 'ME'], 'dica' => 'ca... ma.'],
                ],
                'ditado' => [['MALA', ['MA', 'LA'], ['MO', 'LE']], ['CAMA', ['CA', 'MA'], ['CO', 'ME']]],
                'palavras' => [['MOLA', true], 'MALA', 'LAMA', 'MOLE', 'CAMA'],
            ],
            [
                'slug' => 'missao-5-juntos-salvamos-a-vila', 'titulo' => 'Missão 5: Juntos salvamos a vila',
                'descricao' => 'Uma tempestade de poeira trava a vila lunar; a tripulação inteira puxa a teia.',
                'habilidade_bncc' => 'EF02LP02',
                'fase' => 1, 'ordem' => 5, 'palavra' => 'SALVA', 'publicar' => true,
                'silabas' => [['SAL', ['SA', 'SE', 'SI', 'SO', 'SU']], ['VA']],
                'historia' => [
                    'Uma tempestade de poeira cobriu a vila lunar. A energia da base {{fabrica}} caiu e as portas travaram.',
                    '{{heroi}} chamou os amigos: a boneca-robô, o robô da mola e a tripulação toda. Cada um ajudou do seu jeito.',
                    'A teia virou uma rede e todo mundo puxou junto. A vila salva fez uma festa na sala de comando. — Ninguém salva a vila sozinho. A gente salva junto!',
                ],
                'perguntas' => [
                    'O que quer dizer salvar alguém?',
                    'Quem salva as pessoas de verdade no lugar onde você mora?',
                    'Como a sua turma pode ajudar quem precisa?',
                ],
                'escolha' => [
                    self::pergunta('O que cobriu a vila lunar?', ['Uma tempestade de poeira', 'Uma chuva de estrelas', 'Um robô gigante'], 'A energia da base caiu.', 'Foi uma tempestade de poeira.', 'cloud'),
                    self::pergunta('Como a vila foi salva?', ['Todo mundo puxou junto', 'O capitão fez tudo sozinho', 'Ninguém ajudou'], 'A teia virou uma rede.', 'Todo mundo puxou junto.', 'users'),
                ],
                'silabas_desafio' => [
                    ['modo' => 'completar', 'palavra' => 'SALVA', 'silabas' => ['SAL', 'VA'], 'oculta' => 1, 'opcoes' => ['VA', 'VE', 'VO'], 'dica' => 'sal... va.'],
                    ['modo' => 'completar', 'palavra' => 'VILA', 'silabas' => ['VI', 'LA'], 'oculta' => 0, 'opcoes' => ['VI', 'VA', 'VO'], 'dica' => 'A palavra começa com vi.'],
                    ['modo' => 'completar', 'palavra' => 'VALE', 'silabas' => ['VA', 'LE'], 'oculta' => 1, 'opcoes' => ['LE', 'LA', 'LO'], 'dica' => 'va... le.'],
                ],
                'ditado' => [['SALA', ['SA', 'LA'], ['SE', 'VA']], ['VILA', ['VI', 'LA'], ['VA', 'LO']]],
                'palavras' => [['SALVA', true], 'SALA', 'VALE', 'VILA'],
            ],

            // ---------- Fase 2: sílabas complexas (rascunho para revisão) ----------
            [
                'slug' => 'missao-6-a-aranha-do-telhado', 'titulo' => 'Missão 6: O robô-aranha',
                'descricao' => 'Um robô-aranha aprende a tecer linhas de energia como a nave.',
                'habilidade_bncc' => 'EF02LP02',
                'fase' => 2, 'ordem' => 1, 'palavra' => 'ARANHA', 'publicar' => false,
                'silabas' => [['A'], ['RA'], ['NHA']],
                'historia' => [
                    'Um robô-aranha pequeno morava no telhado da base {{fabrica}} e queria aprender a tecer como a nave Teia.',
                    '{{heroi}} ensinou fio por fio. No fim do dia, a aranha fez a sua primeira linha de energia e um ninho de teia.',
                ],
                'perguntas' => ['Você já ensinou alguma coisa para alguém? O quê?'],
                'escolha' => [
                    self::pergunta('O que o robô-aranha queria aprender?', ['A tecer', 'A voar', 'A cantar'], 'Como a nave Teia faz.', 'Ele queria aprender a tecer.', 'bug'),
                    self::pergunta('O que a aranha fez no fim do dia?', ['Um ninho de teia', 'Um foguete', 'Uma unha'], 'Foi a primeira linha dela.', 'Ela fez um ninho de teia.', 'network'),
                ],
                'silabas_desafio' => [
                    ['modo' => 'completar', 'palavra' => 'ARANHA', 'silabas' => ['A', 'RA', 'NHA'], 'oculta' => 2, 'opcoes' => ['NHA', 'NHO', 'NHE'], 'dica' => 'a... ra... nha.'],
                    ['modo' => 'completar', 'palavra' => 'LINHA', 'silabas' => ['LI', 'NHA'], 'oculta' => 0, 'opcoes' => ['LI', 'LA', 'LU'], 'dica' => 'A palavra começa com li.'],
                ],
                'ditado' => [['UNHA', ['U', 'NHA'], ['A', 'NHO']], ['LINHA', ['LI', 'NHA'], ['LA', 'NHO']]],
                'palavras' => [['ARANHA', true], 'UNHA', 'NINHO', 'LINHA', 'MINHOCA', 'RATO'],
            ],
            [
                'slug' => 'missao-7-o-que-faz-um-heroi', 'titulo' => 'Missão 7: O que faz um herói?',
                'descricao' => 'As crianças da base perguntam ao capitão o que é ser herói.',
                'habilidade_bncc' => 'EF02LP02',
                'fase' => 2, 'ordem' => 2, 'palavra' => 'HERÓI', 'publicar' => false,
                'silabas' => [['HE'], ['RÓI']],
                'historia' => [
                    'As crianças da base {{fabrica}} perguntaram: — Capitão, o que faz alguém ser um herói?',
                    '— Herói é quem ajuda, cuida e divide — respondeu {{heroi}}. — Não precisa de nave. Qualquer um pode ser, a qualquer hora.',
                ],
                'perguntas' => ['Quem é um herói de verdade para você? Por quê?'],
                'escolha' => [
                    self::pergunta('Para o capitão, o que faz um herói?', ['Ajudar, cuidar e dividir', 'Ter uma nave', 'Ser forte'], 'Não precisa de nave.', 'Herói é quem ajuda, cuida e divide.', 'star'),
                    self::pergunta('Quem pode ser herói?', ['Qualquer um', 'Só quem tem nave', 'Só o capitão'], 'A qualquer hora.', 'Qualquer um pode ser herói.', 'users'),
                ],
                'silabas_desafio' => [
                    ['modo' => 'completar', 'palavra' => 'HERÓI', 'silabas' => ['HE', 'RÓI'], 'oculta' => 0, 'opcoes' => ['HE', 'HA', 'HO'], 'dica' => 'A palavra começa com he.'],
                    ['modo' => 'completar', 'palavra' => 'HORA', 'silabas' => ['HO', 'RA'], 'oculta' => 1, 'opcoes' => ['RA', 'RO', 'RE'], 'dica' => 'ho... ra.'],
                ],
                'ditado' => [['HORA', ['HO', 'RA'], ['HA', 'RO']], ['HINO', ['HI', 'NO'], ['HO', 'NA']]],
                'palavras' => [['HERÓI', true], 'HORA', 'HINO', 'HÁBITO'],
            ],
            [
                'slug' => 'missao-8-os-segredos-da-fabrica', 'titulo' => 'Missão 8: Os segredos da fábrica',
                'descricao' => 'A fábrica de peças abre as portas: ninguém trabalha sozinho.',
                'habilidade_bncc' => 'EF02LP02',
                'fase' => 2, 'ordem' => 3, 'palavra' => 'FÁBRICA', 'publicar' => false,
                'silabas' => [['FÁ'], ['BRI'], ['CA']],
                'historia' => [
                    'A fábrica de peças da base {{fabrica}} abriu as portas para visita. Cada sala tinha uma máquina diferente.',
                    '{{heroi}} descobriu que na fábrica ninguém trabalha sozinho: um corta, outro pinta, outro embala.',
                ],
                'perguntas' => ['Como será o dia de quem trabalha numa fábrica?'],
                'escolha' => [
                    self::pergunta('O que o capitão descobriu na fábrica?', ['Ninguém trabalha sozinho', 'As máquinas são iguais', 'Só uma pessoa trabalha'], 'Um corta, outro pinta, outro embala.', 'Na fábrica ninguém trabalha sozinho.', 'wrench'),
                    self::pergunta('O que cada sala tinha?', ['Uma máquina diferente', 'Uma foca', 'Uma cobra'], 'Ouça a primeira página.', 'Cada sala tinha uma máquina diferente.', 'package'),
                ],
                'silabas_desafio' => [
                    ['modo' => 'completar', 'palavra' => 'FÁBRICA', 'silabas' => ['FÁ', 'BRI', 'CA'], 'oculta' => 1, 'opcoes' => ['BRI', 'BRA', 'BRO'], 'dica' => 'fá... bri... ca.'],
                    ['modo' => 'completar', 'palavra' => 'FOCA', 'silabas' => ['FO', 'CA'], 'oculta' => 0, 'opcoes' => ['FO', 'FA', 'FU'], 'dica' => 'A palavra começa com fo.'],
                ],
                'ditado' => [['FOCA', ['FO', 'CA'], ['FA', 'CO']], ['COBRA', ['CO', 'BRA'], ['CA', 'BRO']]],
                'palavras' => [['FÁBRICA', true], 'FACA', 'FOCA', 'COBRA', 'BRAVO', 'FUBÁ'],
            ],
            [
                'slug' => 'missao-9-a-mascara-misteriosa', 'titulo' => 'Missão 9: A máscara misteriosa',
                'descricao' => 'Uma máscara de oxigênio com um bilhete leva a uma festa surpresa.',
                'habilidade_bncc' => 'EF02LP02',
                'fase' => 2, 'ordem' => 4, 'palavra' => 'MÁSCARA', 'publicar' => false,
                'silabas' => [['MÁS', ['MAS', 'MES', 'MIS', 'MOS', 'MUS']], ['CA'], ['RA']],
                'historia' => [
                    'Uma máscara de oxigênio apareceu na porta da oficina {{fabrica}} com um bilhete: "Descubra quem eu sou!"',
                    '{{heroi}} seguiu as pistas e achou a dona: a engenheira Lila, preparando uma festa surpresa.',
                ],
                'perguntas' => ['Por que as pessoas usam máscara em festas?'],
                'escolha' => [
                    self::pergunta('O que apareceu na porta da oficina?', ['Uma máscara com um bilhete', 'Uma mosca', 'Um ramo'], 'Tinha um bilhete.', 'Apareceu uma máscara com um bilhete.', 'key'),
                    self::pergunta('Quem era a dona da máscara?', ['A engenheira Lila', 'O robô tatu', 'A boneca'], 'Ela preparava uma festa surpresa.', 'A dona era a engenheira Lila.', 'gift'),
                ],
                'silabas_desafio' => [
                    ['modo' => 'completar', 'palavra' => 'MÁSCARA', 'silabas' => ['MÁS', 'CA', 'RA'], 'oculta' => 0, 'opcoes' => ['MÁS', 'MES', 'MOS'], 'dica' => 'A palavra começa com más.'],
                    ['modo' => 'completar', 'palavra' => 'CARA', 'silabas' => ['CA', 'RA'], 'oculta' => 1, 'opcoes' => ['RA', 'RO', 'RE'], 'dica' => 'ca... ra.'],
                ],
                'ditado' => [['CARA', ['CA', 'RA'], ['CO', 'RE']], ['RAMO', ['RA', 'MO'], ['RO', 'MA']]],
                'palavras' => [['MÁSCARA', true], 'MOSCA', 'CARA', 'RAMO'],
            ],
            [
                'slug' => 'missao-10-o-brinquedo-esquecido', 'titulo' => 'Missão 10: O brinquedo esquecido',
                'descricao' => 'Um brinquedo achado no fundo de uma caixa ganha conserto, tinta e nome novo.',
                'habilidade_bncc' => 'EF02LP02',
                'fase' => 2, 'ordem' => 5, 'palavra' => 'BRINQUEDO', 'publicar' => false,
                'silabas' => [['BRIN', ['BRAN', 'BREN', 'BRIN', 'BRON', 'BRUN']], ['QUE'], ['DO']],
                'historia' => [
                    'No fundo de uma caixa da base {{fabrica}}, {{heroi}} achou um brinquedo que ninguém lembrava mais.',
                    'A tripulação consertou, pintou e deu um nome novo para ele. O brinquedo voltou a brincar.',
                ],
                'perguntas' => ['O que dá para fazer com um brinquedo que você não usa mais?'],
                'escolha' => [
                    self::pergunta('Onde estava o brinquedo?', ['No fundo de uma caixa', 'No teto da nave', 'Na lua'], 'Ninguém lembrava mais dele.', 'Estava no fundo de uma caixa.', 'package'),
                    self::pergunta('O que a tripulação fez com o brinquedo?', ['Consertou e pintou', 'Jogou fora', 'Escondeu'], 'Ele ganhou um nome novo.', 'A tripulação consertou e pintou o brinquedo.', 'sparkles'),
                ],
                'silabas_desafio' => [
                    ['modo' => 'completar', 'palavra' => 'BRINQUEDO', 'silabas' => ['BRIN', 'QUE', 'DO'], 'oculta' => 1, 'opcoes' => ['QUE', 'QUI', 'QUA'], 'dica' => 'brin... que... do.'],
                    ['modo' => 'completar', 'palavra' => 'DEDO', 'silabas' => ['DE', 'DO'], 'oculta' => 1, 'opcoes' => ['DO', 'DA', 'DU'], 'dica' => 'de... do.'],
                ],
                'ditado' => [['DEDO', ['DE', 'DO'], ['DA', 'DU']], ['QUILO', ['QUI', 'LO'], ['QUE', 'LA']]],
                'palavras' => [['BRINQUEDO', true], 'BRINCO', 'QUILO', 'QUEDA', 'DEDO', 'QUIABO'],
            ],
        ];
    }
}
