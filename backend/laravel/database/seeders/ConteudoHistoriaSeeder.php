<?php

namespace Database\Seeders;

use App\Services\Conteudo\AplicadorConteudo;
use Illuminate\Database\Seeder;

/**
 * Missões de História (BNCC 1º ano): tempo vivido (ontem, hoje, amanhã), a
 * linha do tempo de cada um até entrar no 1º ano, família e o papel de cada
 * pessoa na comunidade. Na Temporada 1 a Gosma bagunça o diário de bordo da
 * nave (docs/temporada-1.md). Idempotente por slug.
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
                // Temporada 1: a ordem do dia é a do mascote (contada na história),
                // não a da criança: quem estuda à tarde não "erra" por almoçar antes.
                'slug' => 'historia-1-ontem-hoje-amanha',
                'disciplina' => 'historia',
                'titulo' => 'O diário bagunçado',
                'rotulo' => 'ontem',
                'descricao' => 'A Gosma espirrou no diário de bordo: antes e depois, ontem, hoje e amanhã.',
                'habilidade_bncc' => 'EF01HI01',
                'fase' => 1,
                'ordem' => 1,
                'publicar' => true,
                'ilustracao' => 'diario-espirro',
                'desfecho' => 'O diário está em ordem de novo! Numa página, a Gosma deixou um desenho: um coração meio torto.',
                'gancho' => 'O que será que a Gosma quis dizer com esse desenho?',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'O diário de bordo',
                        'config' => ['paginas' => [
                            ['texto' => 'ATCHIM! A Gosma espirrou em cima do diário de bordo da nave Teia. As páginas voaram e ficaram fora de ordem.', 'icone' => 'book-open', 'ilustracao' => 'diario-espirro'],
                            ['texto' => 'O diário guarda tudo em ordem: o que aconteceu ontem, o que acontece hoje e o que vai acontecer amanhã. Vamos arrumar?', 'icone' => 'calendar', 'ilustracao' => 'diario-tempo'],
                        ]],
                    ],
                    [
                        'tipo' => 'ordenar',
                        'titulo' => 'O dia do robozinho',
                        'instrucao' => 'Coloque o dia do {{mascote}} em ordem, do começo ao fim.',
                        'config' => [
                            'instrucao' => 'o dia do robozinho, do começo ao fim',
                            'modo' => 'tempo',
                            'itens' => [['texto' => 'acordar', 'icone' => 'sun'], ['texto' => 'carregar a bateria', 'icone' => 'battery'], ['texto' => 'voar pela base', 'icone' => 'rocket'], ['texto' => 'jantar', 'icone' => 'utensils'], ['texto' => 'dormir', 'icone' => 'moon']],
                            'dica' => 'O que ele faz assim que abre os olhos? E o que faz por último?',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Antes e depois',
                        'instrucao' => 'Toque na resposta certa.',
                        'ilustracao' => 'diario-tempo',
                        'config' => ['itens' => [
                            ['pergunta' => 'Qual dia vem depois de hoje?', 'opcoes' => ['Amanhã', 'Ontem', 'Hoje'], 'correta' => 0, 'dica' => 'É o dia que ainda vai chegar.', 'explicacao' => 'Depois de hoje vem amanhã.', 'icone' => 'calendar'],
                            ['pergunta' => 'Qual dia já passou?', 'opcoes' => ['Ontem', 'Amanhã', 'Hoje'], 'correta' => 0, 'dica' => 'É o dia que veio antes de hoje.', 'explicacao' => 'Ontem já passou.', 'icone' => 'hourglass'],
                        ]],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'ilustracao' => 'diario-espirro',
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
                'habilidade_bncc' => 'EF01HI01',
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
                            'itens' => [['texto' => 'nascer', 'icone' => 'baby'], ['texto' => 'engatinhar', 'icone' => 'footprints'], ['texto' => 'dar os primeiros passos', 'icone' => 'footprints'], ['texto' => 'ir para a pré-escola', 'icone' => 'backpack'], ['texto' => 'entrar no 1º ano', 'icone' => 'school']],
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
                                ['a' => '4 anos', 'b' => 'ir para a pré-escola', 'icone_b' => 'backpack'],
                                ['a' => '6 anos', 'b' => 'entrar no 1º ano', 'icone_b' => 'school'],
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
                            ['pergunta' => 'O que vem primeiro na história de uma pessoa?', 'opcoes' => ['Nascer', 'Ir para a pré-escola', 'Entrar no 1º ano'], 'correta' => 0, 'dica' => 'Antes de tudo.', 'explicacao' => 'Primeiro a pessoa nasce.', 'icone' => 'baby'],
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
                'habilidade_bncc' => 'EF01HI02',
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
                'habilidade_bncc' => 'EF01HI06',
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

            // Fase 2: o diário de bordo conta como a Gosma vira amiga da tripulação.
            // Ela não era vilã: tinha fome e estava sozinha. A História 8 é a festa de
            // boas-vindas e fecha o arco; cada missão faz sentido sozinha.
            [
                'slug' => 'historia-5-brincadeiras-de-ontem-e-de-hoje',
                'disciplina' => 'historia',
                'titulo' => 'Brincadeiras de ontem e de hoje',
                'rotulo' => 'brincar',
                'descricao' => 'Brincadeiras do tempo dos avós e de agora: o que mudou e o que continua igual.',
                'habilidade_bncc' => 'EF01HI05',
                'fase' => 2,
                'ordem' => 1,
                'publicar' => true,
                'desfecho' => 'A Gosma brincou de esconde-esconde e ninguém conseguia achar: ela se esconde muito bem! Foi a primeira vez que ela riu junto com amigos.',
                'gancho' => 'A Gosma ficou curiosa: como será a casa e a escola de {{heroi}}?',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'A Gosma quer brincar',
                        'config' => ['paginas' => [
                            ['texto' => 'No diário de bordo tem um recado novo, todo melado: a Gosma quer brincar, mas não sabe nenhuma brincadeira.', 'icone' => 'book-open'],
                            ['texto' => 'A vovó da tripulação contou: no tempo dela, as crianças brincavam de pião, peteca, bolinha de gude e amarelinha.', 'icone' => 'users'],
                            ['texto' => 'Hoje tem brinquedo novo, como o jogo no tablet. E tem brincadeira que passou dos avós para os netos e continua até hoje, como pular corda e esconde-esconde!', 'icone' => 'gamepad-2'],
                        ]],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Como se brinca?',
                        'instrucao' => 'Ligue cada brincadeira ao jeito de brincar. Toque para ouvir o nome.',
                        'config' => [
                            'instrucao' => 'ligue cada brincadeira ao jeito de brincar',
                            'pares' => [
                                ['a' => 'amarelinha', 'b' => 'pular nos quadrados', 'icone_b' => 'footprints'],
                                ['a' => 'pião', 'b' => 'girar no chão'],
                                ['a' => 'pipa', 'b' => 'voar com o vento', 'icone_b' => 'wind'],
                                ['a' => 'esconde-esconde', 'b' => 'um conta e os outros se escondem', 'icone_b' => 'users'],
                            ],
                            'dica' => 'Pense no que você faz com o corpo em cada brincadeira.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Ontem e hoje',
                        'instrucao' => 'Ouça e toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Qual destas brincadeiras a vovó já brincava quando era criança?', 'opcoes' => ['Pião', 'Jogo no tablet', 'Jogo no celular'], 'correta' => 0, 'dica' => 'No tempo da vovó, não tinha tablet nem celular.', 'explicacao' => 'O pião é uma brincadeira bem antiga.', 'icone' => 'users'],
                            ['pergunta' => 'Qual destes brinquedos é de hoje?', 'opcoes' => ['Jogo no tablet', 'Peteca', 'Bolinha de gude'], 'correta' => 0, 'dica' => 'Qual deles precisa de bateria?', 'explicacao' => 'O tablet é de hoje; peteca e bolinha de gude são antigas.', 'icone' => 'gamepad-2'],
                            ['pergunta' => 'Qual brincadeira os avós brincavam e a gente brinca até hoje?', 'opcoes' => ['Pular corda', 'Jogo no tablet', 'Jogo no celular'], 'correta' => 0, 'dica' => 'Ouça de novo a última página.', 'explicacao' => 'Pular corda passou dos avós para os netos.', 'icone' => 'smile'],
                        ]],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'config' => ['itens' => [
                            ['frase' => 'No tempo dos avós, as crianças brincavam de amarelinha.', 'correta' => true, 'dica' => 'Ouça de novo a segunda página.', 'explicacao' => 'A amarelinha é antiga e continua até hoje.'],
                            ['frase' => 'Antigamente, as crianças jogavam no tablet.', 'correta' => false, 'dica' => 'O tablet é um brinquedo novo.', 'explicacao' => 'O tablet é de hoje; antes não existia.'],
                            ['frase' => 'Tem brincadeira antiga que a gente brinca até hoje.', 'correta' => true, 'dica' => 'Pense no esconde-esconde.', 'explicacao' => 'Muitas brincadeiras passam dos avós para os netos.'],
                        ]],
                    ],
                ],
            ],
            [
                'slug' => 'historia-6-casa-e-escola',
                'disciplina' => 'historia',
                'titulo' => 'Casa e escola',
                'rotulo' => 'casa e escola',
                'descricao' => 'O que a gente faz em casa e na escola, e as regras de cada lugar.',
                'habilidade_bncc' => 'EF01HI04',
                'fase' => 2,
                'ordem' => 2,
                'publicar' => true,
                'desfecho' => 'A Gosma aprendeu: em casa, ajuda a família; na escola, respeita a turma. Agora ela sabe as regras dos dois lugares!',
                'gancho' => 'Na nave, cada um tem uma tarefa. Qual será a tarefa da Gosma?',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Um dia com {{heroi}}',
                        'config' => ['paginas' => [
                            ['texto' => 'A Gosma passou um dia inteiro com {{heroi}}. Ela queria saber como é viver na Terra.', 'icone' => 'house'],
                            ['texto' => 'Em casa, {{heroi}} dorme, toma banho e almoça com a família. Em casa a regra é ajudar: arrumar a cama e guardar os brinquedos.', 'icone' => 'bed'],
                            ['texto' => 'Na escola, {{heroi}} estuda, brinca no recreio com a turma e levanta a mão para falar. Cada lugar tem as suas regras!', 'icone' => 'school'],
                        ]],
                    ],
                    [
                        'tipo' => 'linha_do_tempo',
                        'titulo' => 'O dia da Gosma',
                        'instrucao' => 'Coloque o dia da Gosma em ordem, do começo ao fim.',
                        'config' => [
                            'instrucao' => 'o dia da Gosma, do começo ao fim',
                            'modo' => 'tempo',
                            'itens' => [['texto' => 'acordar em casa', 'icone' => 'sun'], ['texto' => 'ir para a escola', 'icone' => 'backpack'], ['texto' => 'brincar no recreio', 'icone' => 'volleyball'], ['texto' => 'voltar para casa', 'icone' => 'house'], ['texto' => 'dormir', 'icone' => 'moon']],
                            'dica' => 'O dia começa acordando em casa. Dormir é a última coisa.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Onde acontece?',
                        'instrucao' => 'Ouça e toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Onde a gente toma banho e dorme na própria cama?', 'opcoes' => ['Em casa', 'Na escola', 'Na praça'], 'correta' => 0, 'dica' => 'É onde a família mora.', 'explicacao' => 'Em casa a gente toma banho e dorme.', 'icone' => 'house'],
                            ['pergunta' => 'Onde tem professora e a turma toda junta?', 'opcoes' => ['Na escola', 'Em casa', 'Na padaria'], 'correta' => 0, 'dica' => 'É onde a gente estuda.', 'explicacao' => 'Na escola tem professora e turma.', 'icone' => 'school'],
                            ['pergunta' => 'Na sala de aula, o que fazer para falar?', 'opcoes' => ['Levantar a mão e esperar a vez', 'Gritar bem alto', 'Falar todo mundo junto'], 'correta' => 0, 'dica' => 'Ouça de novo a última página.', 'explicacao' => 'Na escola a gente levanta a mão e espera a vez.', 'icone' => 'hand'],
                        ]],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'config' => ['itens' => [
                            ['frase' => 'Em casa e na escola, as regras são sempre iguais.', 'correta' => false, 'dica' => 'Cada lugar tem as suas regras.', 'explicacao' => 'Casa e escola têm regras diferentes.'],
                            ['frase' => 'Em casa, cada um pode ajudar a família.', 'correta' => true, 'dica' => 'Arrumar a cama é ajudar.', 'explicacao' => 'Todos podem ajudar em casa.'],
                            ['frase' => 'Na escola, a gente brinca no recreio com a turma.', 'correta' => true, 'dica' => 'Ouça de novo a última página.', 'explicacao' => 'O recreio é a hora de brincar com a turma.'],
                        ]],
                    ],
                ],
            ],
            [
                'slug' => 'historia-7-quem-cuida-de-que',
                'disciplina' => 'historia',
                'titulo' => 'Quem cuida de quê',
                'rotulo' => 'tarefas',
                'descricao' => 'As tarefas de cada um em casa, na escola e na comunidade; a Gosma ganha a dela na nave.',
                'habilidade_bncc' => 'EF01HI03',
                'fase' => 2,
                'ordem' => 3,
                'publicar' => true,
                'desfecho' => 'A Gosma ganhou a sua tarefa: limpar a nave! Ela come a poeira e as migalhas do chão. Nhac! Todo mundo aplaudiu.',
                'gancho' => 'A tripulação está preparando uma surpresa para a Gosma. Shhh... é uma festa!',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Cada um cuida de algo',
                        'config' => ['paginas' => [
                            ['texto' => 'Na nave Teia, cada um tem uma tarefa: {{heroi}} pilota e o {{mascote}} confere as luzes. A Gosma perguntou: e eu, posso ajudar?', 'icone' => 'rocket'],
                            ['texto' => 'Na Terra também é assim. Em casa, a criança arruma a cama. Na escola, cuida do próprio material.', 'icone' => 'backpack'],
                            ['texto' => 'Na comunidade, todo mundo cuida da rua e da praça: lixo vai no lixo. Cuidar é tarefa de todos!', 'icone' => 'trash-2'],
                        ]],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Onde eu ajudo',
                        'instrucao' => 'Ligue cada lugar a uma tarefa da criança. Toque para ouvir.',
                        'config' => [
                            'instrucao' => 'ligue cada lugar a uma tarefa',
                            'pares' => [
                                ['a' => 'em casa', 'b' => 'arrumar a cama', 'icone_a' => 'house', 'icone_b' => 'bed'],
                                ['a' => 'na escola', 'b' => 'cuidar do material', 'icone_a' => 'school', 'icone_b' => 'pencil'],
                                ['a' => 'na rua e na praça', 'b' => 'jogar o lixo no lixo', 'icone_a' => 'tree', 'icone_b' => 'trash-2'],
                            ],
                            'dica' => 'Pense no que você faz para ajudar em cada lugar.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Quem cuida?',
                        'instrucao' => 'Ouça e toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Como uma criança pode ajudar em casa?', 'opcoes' => ['Guardando os brinquedos', 'Dirigindo o carro', 'Fazendo compras sozinha'], 'correta' => 0, 'dica' => 'É uma tarefa do tamanho de uma criança.', 'explicacao' => 'Guardar os brinquedos é uma tarefa da criança.', 'icone' => 'box'],
                            ['pergunta' => 'Na escola, quem cuida do seu material?', 'opcoes' => ['Você mesmo', 'O vizinho', 'Ninguém'], 'correta' => 0, 'dica' => 'O material é seu.', 'explicacao' => 'Cada um cuida do próprio material.', 'icone' => 'pencil'],
                            ['pergunta' => 'Qual é a tarefa da Gosma na nave?', 'opcoes' => ['Limpar a poeira', 'Pilotar a nave', 'Conferir as luzes'], 'correta' => 0, 'dica' => 'Ela adora comer migalhas.', 'explicacao' => 'A Gosma limpa a nave comendo a poeira.', 'icone' => 'sparkles'],
                        ]],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'config' => ['itens' => [
                            ['frase' => 'Cuidar da praça é tarefa de todos.', 'correta' => true, 'dica' => 'A praça é de todo mundo.', 'explicacao' => 'Todos cuidam do que é de todos.'],
                            ['frase' => 'Só os adultos têm tarefas.', 'correta' => false, 'dica' => 'Quem arruma a cama?', 'explicacao' => 'Crianças também têm tarefas.'],
                            ['frase' => 'Na nave, cada um tem uma tarefa.', 'correta' => true, 'dica' => 'Ouça de novo a primeira página.', 'explicacao' => 'Cada um da tripulação cuida de algo.'],
                        ]],
                    ],
                ],
            ],
            [
                'slug' => 'historia-8-festa-para-a-gosma',
                'disciplina' => 'historia',
                'titulo' => 'Festa para a Gosma',
                'rotulo' => 'festa',
                'descricao' => 'Festas da família, da escola e da comunidade, e a festa de boas-vindas da Gosma na nave.',
                'habilidade_bncc' => 'EF01HI08',
                'fase' => 2,
                'ordem' => 4,
                'publicar' => true,
                'ilustracao' => 'diario-tempo',
                'desfecho' => 'Bem-vinda à tripulação, Gosma! Ela nunca foi malvada: estava com fome e sozinha. Agora tem amigos, uma tarefa e um lugar na nave Teia.',
                'gancho' => 'Com a Gosma a bordo, a nave Teia está pronta para visitar novos planetas!',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Dia de festa',
                        'config' => ['paginas' => [
                            ['texto' => 'Hoje é dia de festa na nave Teia! É uma festa de boas-vindas: a Gosma vai entrar para a tripulação.', 'icone' => 'party-popper'],
                            ['texto' => 'Cada festa lembra algo importante. Tem festa da família, como o aniversário; festa da escola, como a festa junina; e festa da comunidade, como o carnaval da rua.', 'icone' => 'cake'],
                            ['texto' => 'A Gosma ganhou um crachá da tripulação e escreveu no diário de bordo. Desta vez, ela desenhou um coração bem redondo!', 'icone' => 'heart', 'ilustracao' => 'diario-tempo'],
                        ]],
                    ],
                    [
                        'tipo' => 'linha_do_tempo',
                        'titulo' => 'Preparar a festa',
                        'instrucao' => 'Coloque a preparação da festa em ordem, do começo ao fim.',
                        'config' => [
                            'instrucao' => 'a festa, do começo ao fim',
                            'modo' => 'tempo',
                            'itens' => [['texto' => 'marcar o dia no calendário', 'icone' => 'calendar'], ['texto' => 'entregar o convite', 'icone' => 'gift'], ['texto' => 'enfeitar a nave', 'icone' => 'sparkles'], ['texto' => 'fazer a festa', 'icone' => 'party-popper'], ['texto' => 'arrumar tudo depois', 'icone' => 'trash-2']],
                            'dica' => 'Primeiro se escolhe o dia. Arrumar a bagunça vem por último.',
                        ],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Que festa é essa?',
                        'instrucao' => 'Ligue cada festa a quem comemora junto.',
                        'config' => [
                            'instrucao' => 'ligue cada festa a quem comemora',
                            'pares' => [
                                ['a' => 'aniversário da vovó', 'b' => 'festa da família', 'icone_a' => 'cake', 'icone_b' => 'house'],
                                ['a' => 'festa junina da turma', 'b' => 'festa da escola', 'icone_a' => 'flag', 'icone_b' => 'school'],
                                ['a' => 'carnaval da rua', 'b' => 'festa da comunidade', 'icone_a' => 'music', 'icone_b' => 'users'],
                            ],
                            'dica' => 'Pense em onde cada festa acontece e quem vai nela.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Por que festejar?',
                        'instrucao' => 'Ouça e toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Por que a tripulação fez esta festa?', 'opcoes' => ['Para dar boas-vindas à Gosma', 'Porque era o aniversário da nave', 'Para ganhar presentes'], 'correta' => 0, 'dica' => 'A Gosma entrou para a tripulação.', 'explicacao' => 'Foi uma festa de boas-vindas para a Gosma.', 'icone' => 'party-popper'],
                            ['pergunta' => 'Qual destas é uma festa da família?', 'opcoes' => ['O aniversário da vovó', 'A festa junina da escola', 'O carnaval da rua'], 'correta' => 0, 'dica' => 'Quem vai é a família.', 'explicacao' => 'O aniversário é uma festa da família.', 'icone' => 'cake'],
                            ['pergunta' => 'Para que servem as festas?', 'opcoes' => ['Para comemorar juntos algo importante', 'Para ficar sozinho', 'Para dormir cedo'], 'correta' => 0, 'dica' => 'Ouça de novo a segunda página.', 'explicacao' => 'Cada festa lembra algo importante e junta as pessoas.', 'icone' => 'heart'],
                        ]],
                    ],
                ],
            ],
        ];
    }
}
