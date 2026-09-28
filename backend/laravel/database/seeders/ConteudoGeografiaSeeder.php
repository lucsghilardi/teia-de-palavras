<?php

namespace Database\Seeders;

use App\Services\Conteudo\AplicadorConteudo;
use Illuminate\Database\Seeder;

/**
 * Missões de Geografia (BNCC 1º ano): a nave Teia visita a Terra e observa os
 * lugares de vivência (casa, rua, escola), o caminho de casa até a escola,
 * direita e esquerda com o corpo como referência, campo e cidade. Idempotente por slug.
 */
class ConteudoGeografiaSeeder extends Seeder
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
                'slug' => 'geografia-1-minha-casa-e-minha-rua',
                'disciplina' => 'geografia',
                'titulo' => 'Minha casa e minha rua',
                'rotulo' => 'casa',
                'descricao' => 'Endereço, vizinhos e os lugares perto de casa.',
                'habilidade_bncc' => 'EF01GE01',
                'fase' => 1,
                'ordem' => 1,
                'publicar' => true,
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Visita à Terra',
                        'config' => ['paginas' => [
                            ['texto' => 'A nave Teia pousou na Terra para uma visita. {{heroi}} mostrou onde mora: uma casa com um número na porta, numa rua com nome.', 'icone' => 'house'],
                            ['texto' => 'Na rua moram os vizinhos: as pessoas que vivem perto. Cada casa tem o seu endereço: o nome da rua e o número.', 'icone' => 'users'],
                            ['texto' => 'Perto da casa ficam lugares que todo mundo usa: a escola, a padaria, a praça e o posto de saúde.', 'icone' => 'map-pin'],
                        ]],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Você entendeu?',
                        'instrucao' => 'Toque na resposta certa.',
                        'config' => ['itens' => [
                            ['pergunta' => 'O que é um endereço?', 'opcoes' => ['O nome da rua e o número da casa', 'O nome da nave', 'O nome do vizinho'], 'correta' => 0, 'dica' => 'Está na porta da casa.', 'explicacao' => 'Endereço é o nome da rua e o número da casa.', 'icone' => 'house'],
                            ['pergunta' => 'Quem são os vizinhos?', 'opcoes' => ['As pessoas que moram perto', 'As pessoas que moram longe', 'Os robôs da base'], 'correta' => 0, 'dica' => 'Eles moram na mesma rua.', 'explicacao' => 'Vizinhos são as pessoas que moram perto.', 'icone' => 'users'],
                        ]],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Lugares perto de casa',
                        'instrucao' => 'Ligue cada lugar ao que acontece nele.',
                        'config' => [
                            'instrucao' => 'ligue cada lugar ao que acontece nele',
                            'pares' => [
                                ['a' => 'escola', 'b' => 'estudar', 'icone_a' => 'school', 'icone_b' => 'book'],
                                ['a' => 'padaria', 'b' => 'comprar pão', 'icone_a' => 'store', 'icone_b' => 'cookie'],
                                ['a' => 'praça', 'b' => 'brincar ao ar livre', 'icone_a' => 'tree', 'icone_b' => 'volleyball'],
                                ['a' => 'posto de saúde', 'b' => 'cuidar da saúde', 'icone_a' => 'hospital', 'icone_b' => 'heart'],
                            ],
                            'dica' => 'Pense no que as pessoas fazem em cada lugar.',
                        ],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'config' => ['itens' => [
                            ['frase' => 'A rua fica dentro da casa.', 'correta' => false, 'dica' => 'A casa fica na rua, não o contrário.', 'explicacao' => 'A casa fica na rua.'],
                            ['frase' => 'Cada casa tem um endereço.', 'correta' => true, 'dica' => 'Rua e número.', 'explicacao' => 'Toda casa tem rua e número.'],
                            ['frase' => 'Vizinhos são as pessoas que moram perto.', 'correta' => true, 'dica' => 'Eles moram na mesma rua ou pertinho.', 'explicacao' => 'Vizinhos moram perto.'],
                        ]],
                    ],
                ],
            ],
            [
                'slug' => 'geografia-2-o-mapa-do-bairro',
                'disciplina' => 'geografia',
                'titulo' => 'O mapa do bairro',
                'rotulo' => 'mapa',
                'descricao' => 'O bairro visto de cima: achar os lugares no mapa.',
                'habilidade_bncc' => 'EF01GE08',
                'fase' => 1,
                'ordem' => 2,
                'publicar' => true,
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Visto de cima',
                        'config' => ['paginas' => [
                            ['texto' => 'Lá do alto, a nave viu o bairro de um jeito diferente: a rua vira uma linha e as casas viram quadradinhos. Isso é um mapa.', 'icone' => 'map'],
                            ['texto' => 'Com o mapa, a tripulação achou a escola, a padaria e a praça sem se perder.', 'icone' => 'map-pin'],
                        ]],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Você entendeu?',
                        'instrucao' => 'Toque na resposta certa.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Como o bairro aparece num mapa?', 'opcoes' => ['Visto de cima', 'Visto de lado', 'Visto de baixo'], 'correta' => 0, 'dica' => 'Como a nave vê lá do alto.', 'explicacao' => 'O mapa mostra o bairro visto de cima.', 'icone' => 'map'],
                            ['pergunta' => 'Para que serve um mapa?', 'opcoes' => ['Para achar lugares sem se perder', 'Para contar estrelas', 'Para brincar de pipa'], 'correta' => 0, 'dica' => 'A tripulação usou para achar a escola.', 'explicacao' => 'O mapa ajuda a achar lugares.', 'icone' => 'compass'],
                        ]],
                    ],
                    [
                        'tipo' => 'mapa_pontos',
                        'titulo' => 'Ache no mapa',
                        'instrucao' => 'Toque no lugar que a pergunta pede. Toque nos lugares para ouvir o nome.',
                        'config' => [
                            'cenario' => 'bairro',
                            'pontos' => [
                                ['chave' => 'casa', 'rotulo' => 'a casa do capitão', 'icone' => 'house', 'x' => 0.18, 'y' => 0.27],
                                ['chave' => 'escola', 'rotulo' => 'a escola', 'icone' => 'school', 'x' => 0.74, 'y' => 0.25],
                                ['chave' => 'padaria', 'rotulo' => 'a padaria', 'icone' => 'store', 'x' => 0.5, 'y' => 0.52],
                                ['chave' => 'praca', 'rotulo' => 'a praça', 'icone' => 'tree', 'x' => 0.2, 'y' => 0.75],
                                ['chave' => 'posto', 'rotulo' => 'o posto de saúde', 'icone' => 'hospital', 'x' => 0.78, 'y' => 0.74],
                            ],
                            'perguntas' => [
                                ['alvo' => 'escola', 'texto' => 'Onde fica a escola?', 'dica' => 'Toque nos lugares para ouvir o nome de cada um.'],
                                ['alvo' => 'padaria', 'texto' => 'Toque no lugar onde se compra pão.', 'dica' => 'Pão se compra na padaria.'],
                                ['alvo' => 'praca', 'texto' => 'Onde a tripulação brinca ao ar livre?', 'dica' => 'É o lugar com árvores.'],
                            ],
                        ],
                    ],
                    [
                        'tipo' => 'ordenar',
                        'titulo' => 'O caminho até a escola',
                        'instrucao' => 'Coloque o caminho em ordem.',
                        'config' => [
                            'instrucao' => 'o caminho de casa até a escola',
                            'modo' => 'sequencia',
                            'itens' => [['texto' => 'sair de casa', 'icone' => 'house'], ['texto' => 'passar pela padaria', 'icone' => 'store'], ['texto' => 'atravessar na faixa', 'icone' => 'footprints'], ['texto' => 'chegar na escola', 'icone' => 'school']],
                            'dica' => 'Tudo começa saindo de casa.',
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'geografia-3-caminhos-e-referencias',
                'disciplina' => 'geografia',
                'titulo' => 'Caminhos e referências',
                'rotulo' => 'caminho',
                'descricao' => 'Pontos de referência, direita e esquerda, em cima e embaixo.',
                'habilidade_bncc' => 'EF01GE09',
                'fase' => 1,
                'ordem' => 3,
                'publicar' => true,
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Pontos de referência',
                        'config' => ['paginas' => [
                            ['texto' => 'Para chegar à escola, {{heroi}} usa pontos de referência: lugares fáceis de ver, como a padaria da esquina e a árvore grande.', 'icone' => 'signpost'],
                            ['texto' => 'Ele segue em frente até a padaria, vira à direita, e a escola fica do lado esquerdo da praça.', 'icone' => 'route'],
                        ]],
                    ],
                    [
                        'tipo' => 'ordenar',
                        'titulo' => 'O caminho do capitão',
                        'instrucao' => 'Coloque o caminho em ordem.',
                        'config' => [
                            'instrucao' => 'o caminho de casa até a escola',
                            'modo' => 'sequencia',
                            'itens' => [['texto' => 'sair de casa', 'icone' => 'house'], ['texto' => 'seguir em frente até a padaria', 'icone' => 'store'], ['texto' => 'virar à direita', 'icone' => 'signpost'], ['texto' => 'chegar na escola, ao lado da praça', 'icone' => 'school']],
                            'dica' => 'Primeiro sair de casa; a padaria vem antes de virar.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Você entendeu?',
                        'instrucao' => 'Toque na resposta certa.',
                        'config' => ['itens' => [
                            ['pergunta' => 'O que é um ponto de referência?', 'opcoes' => ['Um lugar fácil de ver que ajuda a achar o caminho', 'O número da casa', 'Um planeta'], 'correta' => 0, 'dica' => 'Como a padaria da esquina.', 'explicacao' => 'Ponto de referência é um lugar fácil de ver que ajuda a achar o caminho.', 'icone' => 'signpost'],
                            ['pergunta' => 'Depois da padaria, para onde o capitão vira?', 'opcoes' => ['À direita', 'À esquerda', 'Para trás'], 'correta' => 0, 'dica' => 'Ouça a segunda página.', 'explicacao' => 'Ele vira à direita.', 'icone' => 'route'],
                        ]],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Onde fica?',
                        'instrucao' => 'Ligue cada posição ao exemplo.',
                        'config' => [
                            'instrucao' => 'ligue cada posição ao exemplo',
                            'pares' => [
                                ['a' => 'em cima', 'b' => 'o teto'],
                                ['a' => 'embaixo', 'b' => 'o chão'],
                                ['a' => 'dentro', 'b' => 'a sala'],
                                ['a' => 'fora', 'b' => 'o quintal'],
                            ],
                            'dica' => 'Pense onde cada coisa fica na sua casa.',
                        ],
                    ],
                ],
            ],
            [
                'slug' => 'geografia-4-campo-e-cidade',
                'disciplina' => 'geografia',
                'titulo' => 'Campo e cidade',
                'rotulo' => 'campo',
                'descricao' => 'Dois jeitos de viver que precisam um do outro.',
                'habilidade_bncc' => 'EF01GE07',
                'fase' => 1,
                'ordem' => 4,
                'publicar' => true,
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Dois lugares',
                        'config' => ['paginas' => [
                            ['texto' => 'Do alto, a nave viu dois lugares bem diferentes: o campo, com plantações, animais e poucas casas; e a cidade, cheia de prédios, ruas e carros.', 'icone' => 'tree'],
                            ['texto' => 'No campo, o dia começa cedo com a plantação. Na cidade, muita gente trabalha em lojas, escolas e escritórios. Um precisa do outro: a comida vem do campo e as ferramentas, da cidade.', 'icone' => 'store'],
                        ]],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Você entendeu?',
                        'instrucao' => 'Toque na resposta certa.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Onde há mais prédios e carros?', 'opcoes' => ['Na cidade', 'No campo', 'Na lua'], 'correta' => 0, 'dica' => 'Muitas ruas e muita gente.', 'explicacao' => 'A cidade tem mais prédios e carros.', 'icone' => 'store'],
                            ['pergunta' => 'De onde vem a maior parte da comida?', 'opcoes' => ['Do campo', 'Da cidade', 'Da nave'], 'correta' => 0, 'dica' => 'Onde ficam as plantações?', 'explicacao' => 'A comida vem do campo.', 'icone' => 'carrot'],
                        ]],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'config' => ['itens' => [
                            ['frase' => 'No campo há plantações e animais.', 'correta' => true, 'dica' => 'Ouça a primeira página.', 'explicacao' => 'O campo tem plantações e animais.'],
                            ['frase' => 'A cidade tem poucas casas e muitas plantações.', 'correta' => false, 'dica' => 'Isso parece o campo.', 'explicacao' => 'A cidade tem muitos prédios e ruas.'],
                            ['frase' => 'Campo e cidade precisam um do outro.', 'correta' => true, 'dica' => 'De onde vem a comida? E as ferramentas?', 'explicacao' => 'Um precisa do outro.'],
                            ['frase' => 'Na cidade há muitos prédios.', 'correta' => true, 'dica' => 'Pense numa rua cheia de gente.', 'explicacao' => 'A cidade é cheia de prédios.'],
                        ]],
                    ],
                ],
            ],
        ];
    }
}
