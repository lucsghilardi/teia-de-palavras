<?php

namespace Database\Seeders;

use App\Services\Conteudo\AplicadorConteudo;
use Illuminate\Database\Seeder;

/**
 * Missões de História (BNCC 2º ano): tempo (ontem, hoje, amanhã), a linha do
 * tempo de cada um, família e trabalhos da comunidade. Idempotente por slug.
 */
class ConteudoHistoriaSeeder extends Seeder
{
    public function run(AplicadorConteudo $aplicador): void
    {
        $aplicador->aplicarLista(self::missoes());
    }

    /** @return list<array<string, mixed>> */
    public static function missoes(): array
    {
        return [
            [
                'slug' => 'historia-1-ontem-hoje-amanha',
                'disciplina' => 'historia',
                'titulo' => 'Ontem, hoje, amanhã',
                'rotulo' => 'ontem',
                'descricao' => 'Antes e depois: a ordem das coisas no diário de bordo.',
                'habilidade_bncc' => 'EF02HI06',
                'fase' => 1,
                'ordem' => 1,
                'publicar' => true,
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'O diário de bordo',
                        'config' => ['paginas' => [
                            ['texto' => 'O diário de bordo da nave Teia guarda tudo em ordem: o que aconteceu ontem, o que acontece hoje e o que vai acontecer amanhã.', 'icone' => 'calendar'],
                            ['texto' => 'Um dia também tem ordem: acordar, ir à escola, almoçar, brincar e dormir. Uma coisa vem antes, outra vem depois.', 'icone' => 'clock'],
                        ]],
                    ],
                    [
                        'tipo' => 'ordenar',
                        'titulo' => 'O dia da tripulação',
                        'instrucao' => 'Coloque o dia em ordem, do começo ao fim.',
                        'config' => [
                            'instrucao' => 'o dia da tripulação, do começo ao fim',
                            'modo' => 'tempo',
                            'itens' => [['texto' => 'acordar', 'icone' => 'sun'], ['texto' => 'tomar café', 'icone' => 'cookie'], ['texto' => 'ir à escola', 'icone' => 'school'], ['texto' => 'almoçar', 'icone' => 'pizza'], ['texto' => 'dormir', 'icone' => 'moon']],
                            'dica' => 'O que você faz assim que abre os olhos?',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Antes e depois',
                        'instrucao' => 'Toque na resposta certa.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Qual dia vem depois de hoje?', 'opcoes' => ['Amanhã', 'Ontem', 'Nunca'], 'correta' => 0, 'dica' => 'É o dia que ainda vai chegar.', 'explicacao' => 'Depois de hoje vem amanhã.', 'icone' => 'calendar'],
                            ['pergunta' => 'O que aconteceu antes de hoje?', 'opcoes' => ['Ontem', 'Amanhã', 'Hoje'], 'correta' => 0, 'dica' => 'É o dia que já passou.', 'explicacao' => 'Antes de hoje foi ontem.', 'icone' => 'hourglass'],
                        ]],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'config' => ['itens' => [
                            ['frase' => 'Ontem vem depois de hoje.', 'correta' => false, 'dica' => 'Ontem já passou.', 'explicacao' => 'Ontem vem antes de hoje.'],
                            ['frase' => 'A gente almoça depois de acordar.', 'correta' => true, 'dica' => 'Ninguém almoça dormindo.', 'explicacao' => 'Primeiro acordar, depois almoçar.'],
                            ['frase' => 'Amanhã já aconteceu.', 'correta' => false, 'dica' => 'Amanhã ainda vai chegar.', 'explicacao' => 'Amanhã ainda não aconteceu.'],
                        ]],
                    ],
                ],
            ],
            [
                'slug' => 'historia-2-minha-linha-do-tempo',
                'disciplina' => 'historia',
                'titulo' => 'Minha linha do tempo',
                'rotulo' => 'linha do tempo',
                'descricao' => 'Os momentos da sua vida em ordem, do mais antigo até hoje.',
                'habilidade_bncc' => 'EF02HI03',
                'fase' => 1,
                'ordem' => 2,
                'publicar' => true,
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Fotos do capitão',
                        'config' => ['paginas' => [
                            ['texto' => 'Cada pessoa tem a sua história. {{heroi}} guardou fotos de quando era bebê, dos primeiros passos e do primeiro dia na escola.', 'icone' => 'camera'],
                            ['texto' => 'Colocar os momentos em ordem é fazer uma linha do tempo: do mais antigo até hoje.', 'icone' => 'hourglass'],
                        ]],
                    ],
                    [
                        'tipo' => 'linha_do_tempo',
                        'titulo' => 'Do mais antigo até hoje',
                        'instrucao' => 'Coloque os momentos em ordem, do mais antigo até hoje.',
                        'config' => [
                            'instrucao' => 'do mais antigo até hoje',
                            'modo' => 'tempo',
                            'itens' => [['texto' => 'nascer', 'icone' => 'baby'], ['texto' => 'engatinhar', 'icone' => 'footprints'], ['texto' => 'dar os primeiros passos', 'icone' => 'footprints'], ['texto' => 'entrar na escola', 'icone' => 'school'], ['texto' => 'fazer 7 anos', 'icone' => 'cake']],
                            'dica' => 'Tudo começa quando a pessoa nasce.',
                        ],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Idade e momento',
                        'instrucao' => 'Ligue cada idade ao que acontece.',
                        'config' => [
                            'instrucao' => 'ligue cada idade ao que acontece',
                            'pares' => [
                                ['a' => '0 anos', 'b' => 'nascer', 'icone_b' => 'baby'],
                                ['a' => '1 ano', 'b' => 'dar os primeiros passos', 'icone_b' => 'footprints'],
                                ['a' => '6 anos', 'b' => 'entrar na escola', 'icone_b' => 'school'],
                                ['a' => '7 anos', 'b' => 'estar no 2º ano', 'icone_b' => 'book'],
                            ],
                            'dica' => 'Quanto menor a idade, mais antigo o momento.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Você entendeu?',
                        'instrucao' => 'Toque na resposta certa.',
                        'config' => ['itens' => [
                            ['pergunta' => 'O que é uma linha do tempo?', 'opcoes' => ['Os momentos em ordem, do mais antigo até hoje', 'Uma linha de energia', 'Uma fila de robôs'], 'correta' => 0, 'dica' => 'Ouça a segunda página.', 'explicacao' => 'Linha do tempo é a ordem dos momentos.', 'icone' => 'hourglass'],
                            ['pergunta' => 'O que vem primeiro na história de uma pessoa?', 'opcoes' => ['Nascer', 'Entrar na escola', 'Fazer 7 anos'], 'correta' => 0, 'dica' => 'Antes de tudo.', 'explicacao' => 'Primeiro a pessoa nasce.', 'icone' => 'baby'],
                        ]],
                    ],
                ],
            ],
            [
                'slug' => 'historia-3-minha-familia',
                'disciplina' => 'historia',
                'titulo' => 'Minha família',
                'rotulo' => 'família',
                'descricao' => 'Cada família é de um jeito; o que faz uma família é o cuidado.',
                'habilidade_bncc' => 'EF02HI01',
                'fase' => 1,
                'ordem' => 3,
                'publicar' => true,
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'A tripulação',
                        'config' => ['paginas' => [
                            ['texto' => 'A tripulação da nave Teia é como uma família: cada um cuida do outro. Na Terra, as famílias também são assim, e cada uma é de um jeito.', 'icone' => 'users'],
                            ['texto' => 'Tem família grande e família pequena; com avós, tios, primos, padrasto ou madrasta. O que faz uma família é o cuidado.', 'icone' => 'heart'],
                        ]],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Quem é quem',
                        'instrucao' => 'Ligue cada pessoa da família a quem ela é.',
                        'config' => [
                            'instrucao' => 'ligue cada pessoa a quem ela é',
                            'pares' => [
                                ['a' => 'avó', 'b' => 'mãe da mãe ou do pai'],
                                ['a' => 'tio', 'b' => 'irmão da mãe ou do pai'],
                                ['a' => 'primo', 'b' => 'filho do tio ou da tia'],
                                ['a' => 'bisavó', 'b' => 'mãe da avó'],
                            ],
                            'dica' => 'Pense em quem é filho de quem.',
                        ],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'config' => ['itens' => [
                            ['frase' => 'Toda família é igual.', 'correta' => false, 'dica' => 'Cada uma é de um jeito.', 'explicacao' => 'Cada família é de um jeito.'],
                            ['frase' => 'Uma família pode ser grande ou pequena.', 'correta' => true, 'dica' => 'Ouça a segunda página.', 'explicacao' => 'Família pode ser grande ou pequena.'],
                            ['frase' => 'Primo é o filho do tio ou da tia.', 'correta' => true, 'dica' => 'Quem é filho de quem?', 'explicacao' => 'Primo é filho do tio ou da tia.'],
                        ]],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Você entendeu?',
                        'instrucao' => 'Toque na resposta certa.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Segundo a história, o que faz uma família?', 'opcoes' => ['O cuidado', 'O tamanho', 'A nave'], 'correta' => 0, 'dica' => 'Cada um cuida do outro.', 'explicacao' => 'O que faz uma família é o cuidado.', 'icone' => 'heart'],
                            ['pergunta' => 'Quem é a avó?', 'opcoes' => ['A mãe da mãe ou do pai', 'A irmã do pai', 'A filha do tio'], 'correta' => 0, 'dica' => 'Ela é mãe de um dos seus pais.', 'explicacao' => 'A avó é a mãe da mãe ou do pai.', 'icone' => 'users'],
                        ]],
                    ],
                ],
            ],
            [
                'slug' => 'historia-4-trabalhos-da-comunidade',
                'disciplina' => 'historia',
                'titulo' => 'Trabalhos da comunidade',
                'rotulo' => 'trabalho',
                'descricao' => 'Quem faz o quê na base e na comunidade; o caminho do pão.',
                'habilidade_bncc' => 'EF02HI10',
                'fase' => 1,
                'ordem' => 4,
                'publicar' => true,
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Cada um com o seu trabalho',
                        'config' => ['paginas' => [
                            ['texto' => 'Na base, cada um tem um trabalho: quem pilota, quem conserta, quem cozinha. Na comunidade da Terra é igual.', 'icone' => 'wrench'],
                            ['texto' => 'O pão da padaria começa numa plantação de trigo, vira farinha no moinho, é assado pelo padeiro e chega à sua mesa. Muita gente trabalhou nele.', 'icone' => 'cookie'],
                        ]],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Quem faz o quê',
                        'instrucao' => 'Ligue cada pessoa ao seu trabalho.',
                        'config' => [
                            'instrucao' => 'ligue cada pessoa ao seu trabalho',
                            'pares' => [
                                ['a' => 'padeiro', 'b' => 'faz o pão', 'icone_b' => 'cookie'],
                                ['a' => 'médica', 'b' => 'cuida da saúde', 'icone_b' => 'hospital'],
                                ['a' => 'professor', 'b' => 'ensina na escola', 'icone_b' => 'school'],
                                ['a' => 'gari', 'b' => 'limpa as ruas', 'icone_b' => 'footprints'],
                            ],
                            'dica' => 'Pense onde cada pessoa trabalha.',
                        ],
                    ],
                    [
                        'tipo' => 'ordenar',
                        'titulo' => 'O caminho do pão',
                        'instrucao' => 'Coloque o caminho do pão em ordem.',
                        'config' => [
                            'instrucao' => 'o caminho do pão',
                            'modo' => 'sequencia',
                            'itens' => [['texto' => 'plantar o trigo', 'icone' => 'sprout'], ['texto' => 'moer a farinha', 'icone' => 'wrench'], ['texto' => 'assar o pão', 'icone' => 'flame'], ['texto' => 'vender na padaria', 'icone' => 'store']],
                            'dica' => 'Tudo começa na plantação.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Você entendeu?',
                        'instrucao' => 'Toque na resposta certa.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Onde começa o pão da padaria?', 'opcoes' => ['Numa plantação de trigo', 'Na nave', 'Na escola'], 'correta' => 0, 'dica' => 'Antes da farinha vem o trigo.', 'explicacao' => 'O pão começa numa plantação de trigo.', 'icone' => 'sprout'],
                            ['pergunta' => 'Quem limpa as ruas?', 'opcoes' => ['O gari', 'O padeiro', 'A médica'], 'correta' => 0, 'dica' => 'É um trabalho da rua.', 'explicacao' => 'O gari limpa as ruas.', 'icone' => 'footprints'],
                        ]],
                    ],
                ],
            ],
        ];
    }
}
