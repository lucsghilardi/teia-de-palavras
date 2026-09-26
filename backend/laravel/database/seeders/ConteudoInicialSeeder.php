<?php

namespace Database\Seeders;

use App\Models\Aula;
use App\Services\Aulas\AulaEditorService;
use App\Services\Palavras\SugestorFamilia;
use Illuminate\Database\Seeder;

/**
 * As 10 missões iniciais. Personagens ORIGINAIS e editáveis: o herói-aranha do
 * bairro ({{heroi}}) e a fábrica de brinquedos ({{fabrica}}), nomes definidos
 * em Configurações. Tom de aventura, nunca terror.
 *
 * Fase 1 (sílabas simples) entra publicada. Fase 2 (sílabas complexas) entra
 * como rascunho para o educador revisar história e palavras no CMS.
 *
 * Idempotente: aula que já existe (pelo slug) não é tocada, para não apagar
 * edições feitas no CMS.
 */
class ConteudoInicialSeeder extends Seeder
{
    public function run(AulaEditorService $editor): void
    {
        $anterior = null;

        foreach (self::aulas() as $ordemGeral => $dados) {
            $existente = Aula::where('slug', $dados['slug'])->first();

            if ($existente !== null) {
                $anterior = $existente;

                continue;
            }

            $aula = Aula::create([
                'slug' => $dados['slug'],
                'titulo' => $dados['titulo'],
                'fase' => $dados['fase'],
                'ordem' => $dados['ordem'],
                'palavra_geradora' => $dados['palavra'],
                'status' => Aula::STATUS_RASCUNHO,
            ]);

            $editor->atualizar($aula, [
                'titulo' => $dados['titulo'],
                'palavra_geradora' => $dados['palavra'],
                'fase' => $dados['fase'],
                'pre_requisito_aula_id' => $anterior?->id,
                'silabas' => array_map(fn ($s) => [
                    'texto' => $s[0],
                    'familia' => $s[1] ?? SugestorFamilia::para($s[0]),
                ], $dados['silabas']),
                'historia_paginas' => array_map(fn ($t) => ['texto' => $t], $dados['historia']),
                'perguntas' => array_map(fn ($t) => ['texto' => $t], $dados['perguntas']),
                'palavras' => array_map(fn ($p) => [
                    'palavra' => is_array($p) ? $p[0] : $p,
                    'silabas' => [],
                    'destaque' => is_array($p) && ($p[1] ?? false),
                ], $dados['palavras']),
            ]);

            if ($dados['publicar']) {
                $editor->publicar($aula);
            }

            $anterior = $aula;
        }
    }

    /** @return list<array<string, mixed>> */
    public static function aulas(): array
    {
        return [
            [
                'slug' => 'missao-1-a-teia-do-bairro', 'titulo' => 'Missão 1: A teia do bairro',
                'fase' => 1, 'ordem' => 1, 'palavra' => 'TEIA', 'publicar' => true,
                'silabas' => [['TEI'], ['A']],
                'historia' => [
                    'Este é {{heroi}}, o herói-aranha do nosso bairro. Ele mora no alto de um prédio azul.',
                    'Toda manhã, {{heroi}} solta uma TEIA bem comprida e olha as ruas lá de cima.',
                    'Hoje a vizinha chamou: — {{heroi}}, o meu tatu de estimação subiu no teto e não sabe descer!',
                    '{{heroi}} teceu uma TEIA forte, como uma ponte. O tatu desceu devagar, sem pressa.',
                    'A tia e o tio da vizinha bateram palmas. Ajudar o bairro é a missão de {{heroi}}. E hoje é a sua também!',
                ],
                'perguntas' => [
                    'Quem ajuda as pessoas no seu bairro?',
                    'Você já ajudou alguém? Como foi?',
                    'O que a gente pode fazer quando alguém precisa de ajuda?',
                ],
                'palavras' => [['TEIA', true], 'TATU', 'TIA', 'TIO', 'TETO'],
            ],
            [
                'slug' => 'missao-2-a-boneca-perdida', 'titulo' => 'Missão 2: A boneca perdida',
                'fase' => 1, 'ordem' => 2, 'palavra' => 'BONECA', 'publicar' => true,
                'silabas' => [['BO'], ['NE'], ['CA']],
                'historia' => [
                    'Numa noite de lua, {{heroi}} viu uma luz piscando na {{fabrica}}, a fábrica de brinquedos do bairro.',
                    'Lá dentro, num cantinho, estava uma BONECA sozinha. Ela tinha perdido o seu boné vermelho.',
                    '— Eu fiquei com medo quando todo mundo foi embora — disse a BONECA, baixinho.',
                    '{{heroi}} sentou do lado dela: — Sentir medo acontece com todo mundo. Vamos procurar o seu boné juntos?',
                    'Eles acharam o boné dentro de um cubo de madeira. A BONECA abriu um sorriso de orelha a orelha!',
                ],
                'perguntas' => [
                    'Como você acha que a boneca se sentiu sozinha?',
                    'O que você faz quando sente medo?',
                    'Como a gente pode ajudar um amigo que está com medo?',
                ],
                'palavras' => [['BONECA', true], 'BOCA', 'BONÉ', 'CUBO', 'CANO', 'NABO'],
            ],
            [
                'slug' => 'missao-3-o-pulo-certeiro', 'titulo' => 'Missão 3: O pulo certeiro',
                'fase' => 1, 'ordem' => 3, 'palavra' => 'PULO', 'publicar' => true,
                'silabas' => [['PU'], ['LO']],
                'historia' => [
                    'Na praça, uma menina estava triste. A pipa dela ficou presa lá no alto da árvore.',
                    '{{heroi}} olhou com atenção antes de pular: o chão estava livre? Estava!',
                    'Com um PULO certeiro, ele pegou a pipa sem quebrar nenhum galho.',
                    'Depois, todo mundo dividiu um saco de pipoca e viu a pipa voar de novo.',
                ],
                'perguntas' => [
                    'Por que é importante tomar cuidado quando a gente pula e brinca?',
                    'Quem cuida da praça do seu bairro?',
                    'Qual brincadeira você mais gosta de fazer na praça?',
                ],
                'palavras' => [['PULO', true], 'PIPA', 'LUPA', 'LULA', 'PIPOCA'],
            ],
            [
                'slug' => 'missao-4-a-mola-do-robo', 'titulo' => 'Missão 4: A mola do robô',
                'fase' => 1, 'ordem' => 4, 'palavra' => 'MOLA', 'publicar' => true,
                'silabas' => [['MO'], ['LA']],
                'historia' => [
                    'Na {{fabrica}}, um robô de brinquedo não conseguia mais pular. Estava faltando uma MOLA!',
                    '{{heroi}} foi conhecer quem trabalha na fábrica: a Dona Lila, que monta os brinquedos com as mãos.',
                    '— Cada brinquedo dá muito trabalho — contou Dona Lila, mostrando uma caixa cheia de MOLAS.',
                    'Juntos, eles colocaram a MOLA no robô. Boing! O robô pulou até em cima da mala de ferramentas.',
                ],
                'perguntas' => [
                    'Quem será que trabalha na fábrica que faz os brinquedos?',
                    'Que trabalho você gostaria de fazer quando crescer?',
                    'Como a gente pode cuidar das coisas que alguém fez com tanto trabalho?',
                ],
                'palavras' => [['MOLA', true], 'MALA', 'LAMA', 'MOLE', 'CAMA'],
            ],
            [
                'slug' => 'missao-5-juntos-salvamos-a-vila', 'titulo' => 'Missão 5: Juntos salvamos a vila',
                'fase' => 1, 'ordem' => 5, 'palavra' => 'SALVA', 'publicar' => true,
                'silabas' => [['SAL', ['SA', 'SE', 'SI', 'SO', 'SU']], ['VA']],
                'historia' => [
                    'Choveu muito e a rua da vila virou um rio de lama. Os brinquedos da {{fabrica}} ficaram presos!',
                    '{{heroi}} chamou os amigos: a boneca, o robô da mola e a menina da pipa.',
                    'Cada um ajudou do seu jeito. A teia virou uma rede e todo mundo puxou junto.',
                    'Os brinquedos foram salvos! A vila fez uma festa na sala da escola.',
                    '— Ninguém SALVA a vila sozinho — disse {{heroi}}. — A gente salva junto!',
                ],
                'perguntas' => [
                    'O que quer dizer salvar alguém?',
                    'Quem salva as pessoas no bairro de verdade?',
                    'Como a sua turma pode ajudar a vila?',
                ],
                'palavras' => [['SALVA', true], 'SALA', 'VALE', 'VILA'],
            ],

            // ---------- Fase 2: sílabas complexas (rascunho para revisão) ----------
            [
                'slug' => 'missao-6-a-aranha-do-telhado', 'titulo' => 'Missão 6: A aranha do telhado',
                'fase' => 2, 'ordem' => 1, 'palavra' => 'ARANHA', 'publicar' => false,
                'silabas' => [['A'], ['RA'], ['NHA']],
                'historia' => [
                    'Uma ARANHA pequenininha morava no telhado da escola e queria aprender a tecer como {{heroi}}.',
                    '{{heroi}} ensinou fio por fio. No fim do dia, a ARANHA fez o seu primeiro ninho de teia!',
                ],
                'perguntas' => ['Você já ensinou alguma coisa para alguém? O quê?'],
                'palavras' => [['ARANHA', true], 'UNHA', 'NINHO', 'LINHA', 'MINHOCA', 'RATO'],
            ],
            [
                'slug' => 'missao-7-o-que-faz-um-heroi', 'titulo' => 'Missão 7: O que faz um herói?',
                'fase' => 2, 'ordem' => 2, 'palavra' => 'HERÓI', 'publicar' => false,
                'silabas' => [['HE'], ['RÓI']],
                'historia' => [
                    'As crianças do bairro perguntaram: — {{heroi}}, o que faz alguém ser um HERÓI?',
                    '— HERÓI é quem ajuda, cuida e divide — respondeu ele. — Qualquer um pode ser!',
                ],
                'perguntas' => ['Quem é um herói de verdade para você? Por quê?'],
                'palavras' => [['HERÓI', true], 'HORA', 'HINO', 'HÁBITO'],
            ],
            [
                'slug' => 'missao-8-os-segredos-da-fabrica', 'titulo' => 'Missão 8: Os segredos da fábrica',
                'fase' => 2, 'ordem' => 3, 'palavra' => 'FÁBRICA', 'publicar' => false,
                'silabas' => [['FÁ'], ['BRI'], ['CA']],
                'historia' => [
                    'A {{fabrica}} abriu as portas para visita! Cada sala tinha uma máquina diferente.',
                    '{{heroi}} descobriu que na FÁBRICA ninguém trabalha sozinho: um corta, outro pinta, outro embala.',
                ],
                'perguntas' => ['Como será o dia de quem trabalha numa fábrica?'],
                'palavras' => [['FÁBRICA', true], 'FACA', 'FOCA', 'COBRA', 'BRAVO', 'FUBÁ'],
            ],
            [
                'slug' => 'missao-9-a-mascara-misteriosa', 'titulo' => 'Missão 9: A máscara misteriosa',
                'fase' => 2, 'ordem' => 4, 'palavra' => 'MÁSCARA', 'publicar' => false,
                'silabas' => [['MÁS', ['MAS', 'MES', 'MIS', 'MOS', 'MUS']], ['CA'], ['RA']],
                'historia' => [
                    'Uma MÁSCARA apareceu na porta da fábrica, com um bilhete: "Descubra quem eu sou!"',
                    '{{heroi}} seguiu as pistas e achou a dona: a Dona Lila, preparando uma festa surpresa!',
                ],
                'perguntas' => ['Por que as pessoas usam máscara em festas?'],
                'palavras' => [['MÁSCARA', true], 'MOSCA', 'CARA', 'RAMO'],
            ],
            [
                'slug' => 'missao-10-o-brinquedo-esquecido', 'titulo' => 'Missão 10: O brinquedo esquecido',
                'fase' => 2, 'ordem' => 5, 'palavra' => 'BRINQUEDO', 'publicar' => false,
                'silabas' => [['BRIN', ['BRAN', 'BREN', 'BRIN', 'BRON', 'BRUN']], ['QUE'], ['DO']],
                'historia' => [
                    'No fundo de uma caixa, {{heroi}} achou um BRINQUEDO que ninguém lembrava mais.',
                    'A turma consertou, pintou e deu um nome novo para ele. O BRINQUEDO voltou a brincar!',
                ],
                'perguntas' => ['O que a gente pode fazer com um brinquedo que não usa mais?'],
                'palavras' => [['BRINQUEDO', true], 'BRINCO', 'QUILO', 'QUEDA', 'DEDO', 'QUIABO'],
            ],
        ];
    }
}
