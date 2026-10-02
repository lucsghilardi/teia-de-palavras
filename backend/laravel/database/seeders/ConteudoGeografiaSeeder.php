<?php

namespace Database\Seeders;

use App\Services\Conteudo\AplicadorConteudo;
use Illuminate\Database\Seeder;

/**
 * Missões de Geografia (BNCC 1º ano): a nave Teia visita a Terra e observa os
 * lugares de vivência (casa, rua, escola), o caminho de casa até a escola,
 * direita e esquerda com o corpo como referência, campo e cidade. Na Temporada 1
 * a Gosma leva o mascote para o bairro e o mapa vira ferramenta de resgate
 * (docs/temporada-1.md). Idempotente por slug.
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
                'ilustracao' => 'capa-casa',
                'desfecho' => '{{heroi}} mostrou a casa, a rua e os vizinhos. Agora a tripulação conhece o bairro!',
                'gancho' => 'Enquanto isso, alguém escapou da nave e foi passear no bairro...',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Visita à Terra',
                        'config' => ['paginas' => [
                            ['texto' => 'A nave Teia pousou na Terra para uma visita. {{heroi}} mostrou onde mora: uma casa com um número na porta, numa rua com nome.', 'icone' => 'house', 'ilustracao' => 'capa-casa'],
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
                // Temporada 1: o mapa vem logo na 2ª etapa (antes era o quiz sobre
                // o que é um mapa); o quiz fica para o fim, depois da experiência.
                'slug' => 'geografia-2-o-mapa-do-bairro',
                'disciplina' => 'geografia',
                'titulo' => 'Resgate no mapa',
                'rotulo' => 'mapa',
                'descricao' => 'A Gosma levou o mascote para o bairro: achar os lugares no mapa, visto de cima.',
                'habilidade_bncc' => 'EF01GE08',
                'fase' => 1,
                'ordem' => 2,
                'publicar' => true,
                'ilustracao' => 'mapa-bairro',
                'desfecho' => 'Achamos o {{mascote}} escondido atrás da árvore da praça! Ele estava bem, só um pouco melado de gosma.',
                'gancho' => 'Mas por que a Gosma levou o {{mascote}}? Será que ela queria brincar?',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Visto de cima',
                        'config' => ['paginas' => [
                            ['texto' => 'A Gosma levou o {{mascote}} para o bairro! Lá do alto, a rua vira uma linha e as casas viram quadradinhos. Isso é um mapa.', 'icone' => 'map', 'ilustracao' => 'mapa-bairro'],
                            ['texto' => 'Siga o rastro de gosma no mapa. Ache os lugares e descubra onde o {{mascote}} está!', 'icone' => 'map-pin', 'ilustracao' => 'mapa-bairro'],
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
                                ['alvo' => 'praca', 'texto' => 'O rastro de gosma vai até a praça. Onde fica a praça?', 'dica' => 'É o lugar com árvores.'],
                            ],
                        ],
                    ],
                    [
                        'tipo' => 'ordenar',
                        'titulo' => 'O caminho do resgate',
                        'instrucao' => 'Coloque o caminho do resgate em ordem.',
                        'config' => [
                            'instrucao' => 'o caminho da nave até a praça',
                            'modo' => 'sequencia',
                            'itens' => [['texto' => 'sair da nave', 'icone' => 'rocket'], ['texto' => 'passar pela padaria', 'icone' => 'store'], ['texto' => 'atravessar na faixa', 'icone' => 'footprints'], ['texto' => 'chegar na praça', 'icone' => 'tree']],
                            'dica' => 'Tudo começa saindo da nave.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'O que é um mapa?',
                        'instrucao' => 'Toque na resposta certa.',
                        'ilustracao' => 'mapa-bairro',
                        'config' => ['itens' => [
                            ['pergunta' => 'Como o bairro aparece num mapa?', 'opcoes' => ['Visto de cima', 'Visto de lado', 'Visto de dentro'], 'correta' => 0, 'dica' => 'Como a nave vê lá do alto.', 'explicacao' => 'O mapa mostra o bairro visto de cima.', 'icone' => 'map'],
                            ['pergunta' => 'Para que serve um mapa?', 'opcoes' => ['Para achar lugares sem se perder', 'Para medir a altura', 'Para ouvir música'], 'correta' => 0, 'dica' => 'Foi com ele que achamos a praça.', 'explicacao' => 'O mapa ajuda a achar lugares.', 'icone' => 'compass'],
                        ]],
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

            // Fase 2: a Gosma passeia pela Terra com a tripulação e descobre que
            // não precisa ficar sozinha. Cada missão faz sentido sozinha.
            [
                'slug' => 'geografia-5-dia-e-noite',
                'disciplina' => 'geografia',
                'titulo' => 'Dia e noite',
                'rotulo' => 'dia',
                'descricao' => 'O sol e a lua, o dia e a noite, e o que a gente faz em cada parte do dia.',
                'habilidade_bncc' => 'EF01GE05',
                'fase' => 2,
                'ordem' => 1,
                'publicar' => true,
                'desfecho' => 'A Gosma entendeu: de dia todo mundo está acordado para brincar. Agora ela acorda de manhã, junto com a tripulação!',
                'gancho' => 'Amanhã a tripulação vai passear com a Gosma. Mas como estará o tempo: sol ou chuva?',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'A Gosma acordada',
                        'config' => ['paginas' => [
                            ['texto' => 'A Gosma dormia o dia inteiro e acordava de noite. Quando ela queria brincar, todo mundo estava dormindo. Por isso ela se sentia sozinha.', 'icone' => 'moon'],
                            ['texto' => 'De dia, o sol ilumina tudo e o céu fica claro: é hora de ir à escola, brincar e trabalhar. À noite, o céu fica escuro, a lua e as estrelas aparecem, e a maioria das pessoas dorme.', 'icone' => 'sun'],
                            ['texto' => 'A Terra é redonda e gira. Quando aqui é dia, do outro lado da Terra é noite!', 'icone' => 'earth'],
                        ]],
                    ],
                    [
                        'tipo' => 'ordenar',
                        'titulo' => 'Do nascer ao anoitecer',
                        'instrucao' => 'Coloque o caminho do sol em ordem, do começo do dia até a noite.',
                        'config' => [
                            'instrucao' => 'do começo do dia até a noite',
                            'modo' => 'tempo',
                            'itens' => [['texto' => 'o sol nasce', 'icone' => 'sunrise'], ['texto' => 'o sol fica alto no céu', 'icone' => 'sun'], ['texto' => 'o sol se põe', 'icone' => 'sunset'], ['texto' => 'a lua e as estrelas aparecem', 'icone' => 'moon']],
                            'dica' => 'O dia começa quando o sol nasce. A lua aparece por último.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Você entendeu?',
                        'instrucao' => 'Ouça e toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'O que ilumina o dia?', 'opcoes' => ['O sol', 'A lua', 'As estrelas'], 'correta' => 0, 'dica' => 'Ele é grande, quente e amarelo.', 'explicacao' => 'O sol ilumina o dia.', 'icone' => 'sun'],
                            ['pergunta' => 'Quando a maioria das pessoas dorme?', 'opcoes' => ['À noite', 'De manhã', 'À tarde'], 'correta' => 0, 'dica' => 'É quando o céu fica escuro.', 'explicacao' => 'A maioria das pessoas dorme à noite.', 'icone' => 'bed'],
                            ['pergunta' => 'Por que a Gosma se sentia sozinha?', 'opcoes' => ['Ela acordava quando todos dormiam', 'Ela tinha amigos demais', 'Ela não gostava de brincar'], 'correta' => 0, 'dica' => 'Ouça de novo a primeira página.', 'explicacao' => 'Ela acordava de noite, quando todo mundo dormia.', 'icone' => 'moon'],
                        ]],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'config' => ['itens' => [
                            ['frase' => 'De dia, o céu fica claro.', 'correta' => true, 'dica' => 'O sol ilumina tudo.', 'explicacao' => 'De dia o sol deixa o céu claro.'],
                            ['frase' => 'À noite a gente pode ver a lua e as estrelas.', 'correta' => true, 'dica' => 'Olhe o céu escuro.', 'explicacao' => 'À noite aparecem a lua e as estrelas.'],
                            ['frase' => 'Quando aqui é dia, é dia na Terra inteira.', 'correta' => false, 'dica' => 'Ouça de novo a última página.', 'explicacao' => 'Quando aqui é dia, do outro lado da Terra é noite.'],
                        ]],
                    ],
                ],
            ],
            [
                // EF01GE10 (ritmos da natureza no lugar de vivência); a roupa certa para
                // cada tempo também toca o EF01GE11.
                'slug' => 'geografia-6-chuva-sol-e-vento',
                'disciplina' => 'geografia',
                'titulo' => 'Chuva, sol e vento',
                'rotulo' => 'tempo',
                'descricao' => 'Sol, chuva, vento e frio: como fica o lugar onde a gente vive e a roupa certa para cada tempo.',
                'habilidade_bncc' => 'EF01GE10',
                'fase' => 2,
                'ordem' => 2,
                'publicar' => true,
                'desfecho' => 'Com capa e guarda-chuva, ninguém ficou encharcado. E a Gosma? Adorou pular nas poças!',
                'gancho' => 'Amanhã a tripulação vai conhecer a escola de {{heroi}}. A Gosma quer ir junto!',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'O passeio',
                        'config' => ['paginas' => [
                            ['texto' => 'A tripulação saiu para passear com a Gosma. Primeiro fez sol forte: todo mundo passou protetor e pôs boné.', 'icone' => 'sun'],
                            ['texto' => 'Depois veio um vento que balançou as árvores e levou a pipa lá para o alto.', 'icone' => 'wind'],
                            ['texto' => 'No fim da tarde, nuvens escuras e... chuva! O chão ficou molhado. Ainda bem que tinha capa e guarda-chuva na mochila.', 'icone' => 'cloud-rain'],
                        ]],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Tempo e roupa',
                        'instrucao' => 'Ligue cada tempo ao que combina com ele. Toque para ouvir o nome.',
                        'config' => [
                            'instrucao' => 'ligue cada tempo ao que combina com ele',
                            'pares' => [
                                ['a' => 'sol forte', 'b' => 'boné e protetor solar', 'icone_a' => 'sun', 'icone_b' => 'shirt'],
                                ['a' => 'chuva', 'b' => 'capa e guarda-chuva', 'icone_a' => 'cloud-rain', 'icone_b' => 'umbrella'],
                                ['a' => 'frio', 'b' => 'casaco e meia', 'icone_a' => 'snowflake', 'icone_b' => 'shirt'],
                                ['a' => 'vento', 'b' => 'soltar pipa', 'icone_a' => 'wind'],
                            ],
                            'dica' => 'Pense no que você usa quando sai de casa em cada tempo.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'O que levar?',
                        'instrucao' => 'Ouça e toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Está chovendo. O que levar para não se molhar?', 'opcoes' => ['O guarda-chuva', 'A pipa', 'O boné'], 'correta' => 0, 'dica' => 'Ele abre em cima da cabeça.', 'explicacao' => 'O guarda-chuva protege da chuva.', 'icone' => 'umbrella'],
                            ['pergunta' => 'Está muito calor. Qual roupa é melhor?', 'opcoes' => ['Camiseta leve', 'Casaco grosso', 'Gorro de lã'], 'correta' => 0, 'dica' => 'No calor, roupa fresquinha.', 'explicacao' => 'No calor, a roupa leve é melhor.', 'icone' => 'sun'],
                            ['pergunta' => 'Que tempo é bom para soltar pipa?', 'opcoes' => ['Com vento', 'Sem vento nenhum', 'Com chuva forte'], 'correta' => 0, 'dica' => 'Quem leva a pipa lá para o alto?', 'explicacao' => 'O vento faz a pipa subir.', 'icone' => 'wind'],
                        ]],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'config' => ['itens' => [
                            ['frase' => 'Quando chove, o chão fica molhado.', 'correta' => true, 'dica' => 'Lembre das poças da Gosma.', 'explicacao' => 'A chuva molha o chão.'],
                            ['frase' => 'No dia de muito frio, a gente usa casaco.', 'correta' => true, 'dica' => 'O casaco esquenta.', 'explicacao' => 'No frio, o casaco ajuda a esquentar.'],
                            ['frase' => 'Com sol forte, a capa de chuva é a melhor roupa.', 'correta' => false, 'dica' => 'A capa é para quando chove.', 'explicacao' => 'No sol forte, o melhor é boné e roupa leve.'],
                        ]],
                    ],
                ],
            ],
            [
                // Cenário `escola` (frontend/public/cenarios/escola.svg, 800x600): prédio das
                // salas no alto à esquerda, quadra à direita, pátio embaixo com bebedouro
                // (azul) e cantina (amarela), jardim embaixo à direita, portão no muro de baixo.
                'slug' => 'geografia-7-a-escola-por-dentro',
                'disciplina' => 'geografia',
                'titulo' => 'A escola por dentro',
                'rotulo' => 'escola',
                'descricao' => 'Os lugares da escola vistos de cima e as regras para todo mundo conviver bem.',
                'habilidade_bncc' => 'EF01GE04',
                'fase' => 2,
                'ordem' => 3,
                'publicar' => true,
                'desfecho' => 'A Gosma aprendeu as regras da escola: esperou a vez na fila da cantina e ajudou a regar o jardim!',
                'gancho' => 'No domingo, a turma vai à praça do bairro. Que regras será que valem por lá?',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Visita à escola',
                        'config' => ['paginas' => [
                            ['texto' => 'A tripulação e a Gosma foram conhecer a escola de {{heroi}}. Vista de cima, ela tem salas, pátio, quadra, jardim e cantina.', 'icone' => 'school'],
                            ['texto' => 'Nhac! A Gosma quis comer as flores do jardim. A professora explicou: na escola tem regras para todo mundo conviver bem.', 'icone' => 'flower'],
                            ['texto' => 'Esperar a vez, guardar os brinquedos, cuidar das plantas e falar um de cada vez. A turma combina as regras junto!', 'icone' => 'users'],
                        ]],
                    ],
                    [
                        'tipo' => 'mapa_pontos',
                        'titulo' => 'Ache na escola',
                        'instrucao' => 'Toque no lugar que a pergunta pede. Toque nos lugares para ouvir o nome.',
                        'config' => [
                            'cenario' => 'escola',
                            'pontos' => [
                                ['chave' => 'sala', 'rotulo' => 'as salas de aula', 'icone' => 'book-open', 'x' => 0.35, 'y' => 0.27],
                                ['chave' => 'quadra', 'rotulo' => 'a quadra', 'icone' => 'volleyball', 'x' => 0.8, 'y' => 0.35],
                                ['chave' => 'bebedouro', 'rotulo' => 'o bebedouro', 'icone' => 'droplet', 'x' => 0.163, 'y' => 0.6],
                                ['chave' => 'cantina', 'rotulo' => 'a cantina', 'icone' => 'utensils', 'x' => 0.538, 'y' => 0.6],
                                ['chave' => 'patio', 'rotulo' => 'o pátio', 'icone' => 'users', 'x' => 0.35, 'y' => 0.8],
                                ['chave' => 'jardim', 'rotulo' => 'o jardim', 'icone' => 'flower', 'x' => 0.8, 'y' => 0.78],
                                ['chave' => 'portao', 'rotulo' => 'o portão', 'icone' => 'lock', 'x' => 0.525, 'y' => 0.927],
                            ],
                            'perguntas' => [
                                ['alvo' => 'sala', 'texto' => 'Onde as crianças estudam com a professora?', 'dica' => 'Toque nos lugares para ouvir o nome de cada um.'],
                                ['alvo' => 'quadra', 'texto' => 'Onde a turma joga bola?', 'dica' => 'É o lugar com as linhas do jogo.'],
                                ['alvo' => 'jardim', 'texto' => 'Onde ficam as flores que a Gosma quis comer?', 'dica' => 'É o lugar verde, com árvores.'],
                                ['alvo' => 'cantina', 'texto' => 'Onde a turma pega o lanche?', 'dica' => 'Fica no pátio. Toque para ouvir o nome.'],
                            ],
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'As regras da escola',
                        'instrucao' => 'Ouça e toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Na fila da cantina, o que fazer?', 'opcoes' => ['Esperar a vez', 'Passar na frente', 'Empurrar o colega'], 'correta' => 0, 'dica' => 'Na fila, cada um tem a sua vez.', 'explicacao' => 'Na fila, a gente espera a vez.', 'icone' => 'users'],
                            ['pergunta' => 'A brincadeira acabou. E os brinquedos?', 'opcoes' => ['Guardar no lugar', 'Deixar no chão', 'Esconder do colega'], 'correta' => 0, 'dica' => 'Assim todo mundo acha depois.', 'explicacao' => 'Guardar os brinquedos no lugar ajuda todo mundo.', 'icone' => 'box'],
                            ['pergunta' => 'A Gosma quer comer as flores do jardim. Qual é a regra?', 'opcoes' => ['Cuidar das plantas', 'Arrancar as flores', 'Pisar no jardim'], 'correta' => 0, 'dica' => 'As plantas são de todos na escola.', 'explicacao' => 'Na escola a gente cuida das plantas.', 'icone' => 'flower'],
                        ]],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'config' => ['itens' => [
                            ['frase' => 'Na sala, a gente fala um de cada vez.', 'correta' => true, 'dica' => 'Se todos falam juntos, ninguém escuta.', 'explicacao' => 'Falar um de cada vez ajuda todos a ouvir.'],
                            ['frase' => 'Jogar lixo no chão do pátio ajuda a escola.', 'correta' => false, 'dica' => 'Onde vai o lixo?', 'explicacao' => 'O lixo vai no lixo; assim o pátio fica limpo.'],
                            ['frase' => 'As regras ajudam todo mundo a conviver bem.', 'correta' => true, 'dica' => 'Ouça de novo a última página.', 'explicacao' => 'As regras ajudam todos a conviver bem.'],
                        ]],
                    ],
                ],
            ],
            [
                'slug' => 'geografia-8-pracas-e-parques',
                'disciplina' => 'geografia',
                'titulo' => 'Praças e parques',
                'rotulo' => 'praça',
                'descricao' => 'Lugares públicos de lazer: como cada um usa a praça e o parque, e como cuidar deles.',
                'habilidade_bncc' => 'EF01GE03',
                'fase' => 2,
                'ordem' => 4,
                'publicar' => true,
                'ilustracao' => 'mapa-bairro',
                'desfecho' => 'A Gosma ajudou a limpar a praça e fez muitos amigos no bairro. Ela não está mais sozinha!',
                'gancho' => 'Enquanto isso, na nave, a tripulação prepara uma surpresa para a Gosma. Shhh!',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Domingo na praça',
                        'config' => ['paginas' => [
                            ['texto' => 'Domingo, a turma foi com a Gosma à praça do bairro. A praça é um lugar público: é de todo mundo.', 'icone' => 'tree', 'ilustracao' => 'mapa-bairro'],
                            ['texto' => 'Cada um usa a praça de um jeito: crianças no balanço, gente caminhando, famílias fazendo piquenique e uma roda de música.', 'icone' => 'users'],
                            ['texto' => 'Como a praça e o parque são de todos, todos cuidam: lixo no lixo e flores no lugar. A Gosma ajudou a catar os papéis do chão.', 'icone' => 'trash-2'],
                        ]],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Cada um do seu jeito',
                        'instrucao' => 'Ligue cada lugar da praça ao que as pessoas fazem nele.',
                        'config' => [
                            'instrucao' => 'ligue cada lugar ao que se faz nele',
                            'pares' => [
                                ['a' => 'balanço', 'b' => 'brincar', 'icone_b' => 'smile'],
                                ['a' => 'pista', 'b' => 'caminhar e correr', 'icone_b' => 'footprints'],
                                ['a' => 'banco', 'b' => 'sentar e conversar', 'icone_b' => 'users'],
                                ['a' => 'gramado', 'b' => 'fazer piquenique', 'icone_b' => 'utensils'],
                            ],
                            'dica' => 'Pense no que você gosta de fazer em cada canto da praça.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Você entendeu?',
                        'instrucao' => 'Ouça e toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'De quem é a praça?', 'opcoes' => ['De todas as pessoas', 'Só de quem mora ao lado', 'Só dos adultos'], 'correta' => 0, 'dica' => 'Ela é um lugar público.', 'explicacao' => 'A praça é pública: é de todo mundo.', 'icone' => 'users'],
                            ['pergunta' => 'O lanche acabou. O que fazer com o papel?', 'opcoes' => ['Jogar no lixo', 'Deixar na grama', 'Esconder embaixo do banco'], 'correta' => 0, 'dica' => 'Quem cuida da praça somos todos nós.', 'explicacao' => 'Papel vai no lixo; assim a praça fica limpa.', 'icone' => 'trash-2'],
                            ['pergunta' => 'Qual destes lugares é público, para todo mundo usar?', 'opcoes' => ['O parque', 'O quarto da casa', 'A cozinha da casa'], 'correta' => 0, 'dica' => 'Qual deles é de todas as pessoas?', 'explicacao' => 'O parque é público; o quarto e a cozinha são da casa da família.', 'icone' => 'tree'],
                        ]],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'config' => ['itens' => [
                            ['frase' => 'Na praça, cada pessoa pode usar o espaço de um jeito.', 'correta' => true, 'dica' => 'Uns brincam, outros caminham.', 'explicacao' => 'Cada um usa a praça de um jeito.'],
                            ['frase' => 'Arrancar as flores é cuidar do parque.', 'correta' => false, 'dica' => 'Cuidar é deixar as flores no lugar.', 'explicacao' => 'Cuidar do parque é deixar as flores no lugar.'],
                            ['frase' => 'No parque dá para brincar, caminhar e fazer piquenique.', 'correta' => true, 'dica' => 'Ouça de novo a segunda página.', 'explicacao' => 'O parque é lugar de lazer para todos.'],
                        ]],
                    ],
                ],
            ],
        ];
    }
}
