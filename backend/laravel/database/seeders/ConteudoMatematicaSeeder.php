<?php

namespace Database\Seeders;

use App\Services\Conteudo\AplicadorConteudo;
use Illuminate\Database\Seeder;

/**
 * Missões de Matemática (BNCC 1º ano), no universo da nave Teia; na Temporada 1
 * a nave vai ao Planeta Cubo, onde tudo é feito de blocos em pilhas de 10
 * (docs/temporada-1.md). Cada missão
 * é uma sequência de atividades genéricas (config JSON validado pelos
 * avaliadores), do concreto (ícones) ao abstrato (símbolos). A primeira fica
 * nos fatos até 10 com objetos na tela; as seguintes contam e comparam até 100
 * e usam moedas e notas de reais inteiros. Idempotente por slug.
 */
class ConteudoMatematicaSeeder extends Seeder
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
                'slug' => 'matematica-1-somar-para-decolar',
                'disciplina' => 'matematica',
                'titulo' => 'Somar para decolar',
                'rotulo' => '4 + 3',
                'descricao' => 'Contar, juntar e tirar até 10 para abastecer a nave.',
                'habilidade_bncc' => 'EF01MA08',
                'fase' => 1,
                'ordem' => 1,
                'publicar' => true,
                'ilustracao' => 'capa-somar',
                'desfecho' => 'Suprimentos conferidos! A nave Teia decolou rumo ao Planeta Cubo.',
                'gancho' => 'No Planeta Cubo, tudo é feito de blocos. E tem alguém com muita fome por lá...',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'A base lunar',
                        'config' => ['paginas' => [
                            ['texto' => 'A nave Teia vai decolar da base lunar. Antes, a tripulação confere os suprimentos.', 'icone' => 'rocket', 'ilustracao' => 'capa-somar'],
                            ['texto' => 'Chegaram 4 caixas de água e mais 3 de comida. Quantas caixas ao todo? É isso que você vai descobrir.', 'icone' => 'package', 'ilustracao' => 'capa-somar'],
                        ]],
                    ],
                    [
                        'tipo' => 'contar',
                        'titulo' => 'Contar os suprimentos',
                        'instrucao' => 'Conte e toque no número certo.',
                        'config' => ['itens' => [
                            ['icone' => 'star', 'quantidade' => 6],
                            ['icone' => 'rocket', 'quantidade' => 9],
                            ['icone' => 'moon', 'quantidade' => 12],
                        ]],
                    ],
                    [
                        'tipo' => 'somar_subtrair',
                        'titulo' => 'Somar para abastecer',
                        'instrucao' => 'Junte as caixas e escolha o total.',
                        'config' => ['gerar' => ['quantidade' => 4, 'maximo' => 10, 'operacoes' => ['+']], 'apoio' => 'icones'],
                    ],
                    [
                        'tipo' => 'somar_subtrair',
                        'titulo' => 'Desviar dos asteroides',
                        'instrucao' => 'Tire os asteroides que passaram e escolha quantos sobraram.',
                        // 1º ano: tirar com os objetos na tela (concreto); a reta vem nas missões seguintes.
                        'config' => ['itens' => [
                            ['a' => 7, 'b' => 2, 'operacao' => '-'],
                            ['a' => 9, 'b' => 4, 'operacao' => '-'],
                            ['a' => 10, 'b' => 3, 'operacao' => '-'],
                        ], 'apoio' => 'icones'],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Problemas da base',
                        'instrucao' => 'Ouça com calma e toque na resposta.',
                        'config' => ['itens' => [
                            [
                                'pergunta' => 'Na base havia 4 foguetes e chegaram mais 3. Quantos foguetes há agora?',
                                'opcoes' => ['7', '6', '8'],
                                'correta' => 0,
                                'dica' => 'Junte 4 com mais 3: cinco, seis, sete.',
                                'explicacao' => '4 + 3 = 7.',
                            ],
                            [
                                'pergunta' => 'Havia 9 estrelas acesas no painel e 5 apagaram. Quantas ficaram acesas?',
                                'opcoes' => ['4', '5', '14'],
                                'correta' => 0,
                                'dica' => 'Tire 5 de 9.',
                                'explicacao' => '9 - 5 = 4.',
                            ],
                        ]],
                    ],
                ],
            ],
            [
                // Temporada 1: a Gosma comeu a ponte do Planeta Cubo. Contagem em
                // pilhas de 10 com rampa suave (a missão 1 parou em 12).
                'slug' => 'matematica-2-contar-ate-100',
                'disciplina' => 'matematica',
                'titulo' => 'Pilhas de blocos',
                'rotulo' => '10, 20, 30',
                'descricao' => 'Planeta Cubo: contar blocos em pilhas de 10 para refazer a ponte que a Gosma comeu.',
                'habilidade_bncc' => 'EF01MA04',
                'fase' => 1,
                'ordem' => 2,
                'publicar' => true,
                'ilustracao' => 'cubo-ponte',
                'desfecho' => 'Com os blocos contados, a ponte ficou pronta e a tripulação atravessou. Mas a Gosma já tinha fugido!',
                'gancho' => 'Lá no fundo do Planeta Cubo tem uma mina de cristais. Será que a Gosma foi para lá?',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'A ponte comida',
                        'config' => ['paginas' => [
                            ['texto' => 'A nave Teia pousou no Planeta Cubo, onde tudo é feito de blocos. Nhac! A Gosma comeu a ponte!', 'icone' => 'package', 'ilustracao' => 'cubo-ponte'],
                            ['texto' => 'Para refazer a ponte, os blocos vêm em pilhas de 10. Uma pilha e mais 3 soltos: 13 blocos!', 'icone' => 'package', 'ilustracao' => 'cubo-pilhas'],
                        ]],
                    ],
                    [
                        'tipo' => 'contar',
                        'titulo' => 'Contar os blocos',
                        'instrucao' => 'Conte as pilhas de 10 e os blocos soltos. Depois toque no número.',
                        'config' => ['itens' => [
                            ['icone' => 'box', 'quantidade' => 12],
                            ['icone' => 'box', 'quantidade' => 20],
                            ['icone' => 'box', 'quantidade' => 27],
                            ['icone' => 'box', 'quantidade' => 35],
                        ]],
                    ],
                    [
                        'tipo' => 'ordenar',
                        'titulo' => 'Pilhas em ordem',
                        'instrucao' => 'Coloque os números em ordem, do menor ao maior.',
                        'config' => [
                            'instrucao' => 'do menor ao maior',
                            'modo' => 'numeros',
                            'itens' => [['texto' => '8'], ['texto' => '13'], ['texto' => '20'], ['texto' => '27'], ['texto' => '35']],
                            'dica' => 'Comece pelo menor. Quem tem menos pilhas de 10 vem antes.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Blocos para a ponte',
                        'instrucao' => 'Ouça e toque na resposta.',
                        'ilustracao' => 'cubo-pilhas',
                        'config' => ['itens' => [
                            ['pergunta' => 'Uma pilha de 10 e mais 5 blocos soltos. Quantos blocos ao todo?', 'opcoes' => ['15', '6', '51'], 'correta' => 0, 'dica' => 'Comece no 10 e conte mais 5: onze, doze...', 'explicacao' => '10 e mais 5 são 15.'],
                            ['pergunta' => 'Qual número vem logo depois de 29?', 'opcoes' => ['30', '28', '39'], 'correta' => 0, 'dica' => 'Conte a partir de 29: 29, ...', 'explicacao' => 'Depois de 29 vem 30.'],
                            ['pergunta' => 'Qual monte tem mais blocos?', 'opcoes' => ['20', '12', '2'], 'correta' => 0, 'dica' => 'Quem tem mais pilhas de 10?', 'explicacao' => '20 são duas pilhas de 10: é o maior.'],
                        ]],
                    ],
                ],
            ],
            [
                'slug' => 'matematica-3-dezenas-e-unidades',
                'disciplina' => 'matematica',
                'titulo' => 'Dezenas e unidades',
                'rotulo' => '10 + 4',
                'descricao' => 'Pacotes de 10 e caixas soltas: dezenas e unidades nos suprimentos da base.',
                'habilidade_bncc' => 'EF01MA07',
                'fase' => 1,
                'ordem' => 3,
                'publicar' => true,
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Pacotes de 10',
                        'config' => ['paginas' => [
                            ['texto' => 'Na base, as caixas de suprimentos chegam em pacotes de 10. Um pacote fechado é uma dezena.', 'icone' => 'package'],
                            ['texto' => '14 caixas são 1 pacote de 10 e mais 4 soltas: 1 dezena e 4 unidades. 10 + 4 = 14.', 'icone' => 'hash'],
                        ]],
                    ],
                    [
                        'tipo' => 'contar',
                        'titulo' => 'Pacotes e caixas soltas',
                        'instrucao' => 'Conte os pacotes de 10 e as caixas soltas.',
                        'config' => ['itens' => [
                            ['icone' => 'package', 'quantidade' => 14],
                            ['icone' => 'package', 'quantidade' => 32],
                            ['icone' => 'package', 'quantidade' => 57],
                        ]],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Número e pacotes',
                        'instrucao' => 'Ligue cada número ao que ele tem.',
                        'config' => [
                            'instrucao' => 'ligue cada número ao que ele tem',
                            'pares' => [
                                ['a' => '34', 'b' => '3 dezenas e 4 unidades'],
                                ['a' => '50', 'b' => '5 dezenas'],
                                ['a' => '29', 'b' => '2 dezenas e 9 unidades'],
                                ['a' => '7', 'b' => '7 unidades'],
                            ],
                            'dica' => 'Conte os pacotes de 10 primeiro: eles são as dezenas.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Quantas dezenas?',
                        'instrucao' => 'Toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Quantas dezenas tem o número 46?', 'opcoes' => ['4', '6', '46'], 'correta' => 0, 'dica' => 'A dezena é o primeiro algarismo.', 'explicacao' => '46 tem 4 dezenas e 6 unidades.'],
                            ['pergunta' => 'O número 80 tem quantas unidades soltas?', 'opcoes' => ['0', '8', '80'], 'correta' => 0, 'dica' => 'São 8 pacotes fechados e nenhuma caixa solta.', 'explicacao' => '80 são 8 dezenas e 0 unidades.'],
                        ]],
                    ],
                ],
            ],
            [
                'slug' => 'matematica-4-loja-espacial',
                'disciplina' => 'matematica',
                'titulo' => 'Loja espacial',
                'rotulo' => 'R$',
                'descricao' => 'Juntar moedas e notas para pagar o preço certo na loja da base.',
                'habilidade_bncc' => 'EF01MA19',
                'fase' => 1,
                'ordem' => 4,
                'publicar' => true,
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'A loja da base',
                        'config' => ['paginas' => [
                            ['texto' => 'A loja da base vende peças, lanches e adesivos de planetas. Para comprar, a tripulação usa moedas e notas.', 'icone' => 'store'],
                            ['texto' => 'Tem moeda de 1 real e notas de 2, 5 e 10 reais. Juntar as certas é a missão.', 'icone' => 'coins'],
                        ]],
                    ],
                    [
                        'tipo' => 'ordenar',
                        'titulo' => 'Do que vale menos ao que vale mais',
                        'instrucao' => 'Coloque em ordem, do que vale menos ao que vale mais.',
                        'config' => [
                            'instrucao' => 'do que vale menos ao que vale mais',
                            'modo' => 'numeros',
                            'itens' => [['texto' => '1 real', 'icone' => 'coins'], ['texto' => '2 reais', 'icone' => 'banknote'], ['texto' => '5 reais', 'icone' => 'banknote'], ['texto' => '10 reais', 'icone' => 'banknote']],
                            'dica' => 'A moeda de 1 real vale menos que qualquer nota de dinheiro.',
                        ],
                    ],
                    [
                        'tipo' => 'dinheiro',
                        'titulo' => 'Pagar na loja',
                        'instrucao' => 'Toque nas moedas e notas até juntar o preço certo. Depois toque em pagar.',
                        // 1º ano: preços até 10 reais, com moedas de 1 e notas de 2, 5 e 10.
                        'config' => ['itens' => [
                            ['preco' => 3, 'moedas' => [1, 1, 1, 2, 5]],
                            ['preco' => 7, 'moedas' => [1, 2, 2, 5, 10]],
                            ['preco' => 10, 'moedas' => [2, 5, 5, 10]],
                        ]],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Quantas moedas?',
                        'instrucao' => 'Toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Quantas moedas de 1 real formam 5 reais?', 'opcoes' => ['5', '1', '10'], 'correta' => 0, 'dica' => 'Conte de 1 em 1 até chegar em 5.', 'explicacao' => '5 moedas de 1 real são 5 reais.'],
                            ['pergunta' => 'Uma nota de 10 reais vale quantas moedas de 1 real?', 'opcoes' => ['10', '5', '2'], 'correta' => 0, 'dica' => 'Conte de 1 em 1 até 10.', 'explicacao' => 'Uma nota de 10 vale 10 moedas de 1 real.'],
                        ]],
                    ],
                ],
            ],

            // Fase 2: fecha o arco da Gosma (ela não era vilã: tinha fome e estava
            // sozinha). Cada missão faz sentido sozinha; o gancho só sugere a próxima.
            [
                // Reforço: contar de 20 a 50 e comparar (a criança hesitou em 12, 20 e 27).
                // As opções trocam dezena e unidade (34 e 43) para treinar o valor de cada algarismo.
                'slug' => 'matematica-5-a-mina-de-cristais',
                'disciplina' => 'matematica',
                'titulo' => 'A mina de cristais',
                'rotulo' => '20 a 50',
                'descricao' => 'No fundo do Planeta Cubo: contar cristais de 20 a 50 e descobrir qual monte tem mais.',
                'habilidade_bncc' => 'EF01MA05',
                'fase' => 2,
                'ordem' => 1,
                'publicar' => true,
                'desfecho' => 'No fundo da mina, a tripulação viu a Gosma de perto. Ela estava sozinha, mordiscando um cristal. Quando viu a nave, se escondeu.',
                'gancho' => 'A Gosma estava com fome. E se a tripulação preparasse um lanche para ela?',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'A mina',
                        'config' => ['paginas' => [
                            ['texto' => 'A tripulação desceu até o fundo do Planeta Cubo. Lá tem uma mina cheia de cristais brilhantes!', 'icone' => 'gem'],
                            ['texto' => 'Os cristais estão em montes. Alguns têm marquinhas de mordida, e no chão tem um rastro de gosma. Quem será que anda comendo cristais?', 'icone' => 'footprints'],
                            ['texto' => 'Para saber qual monte tem mais, conte de 10 em 10 e depois os soltos. Quem tem mais pilhas de 10 tem mais cristais.', 'icone' => 'gem', 'ilustracao' => 'cubo-pilhas'],
                        ]],
                    ],
                    [
                        'tipo' => 'contar',
                        'titulo' => 'Contar os cristais',
                        'instrucao' => 'Conte as pilhas de 10 e os cristais soltos. Depois toque no número.',
                        'config' => ['itens' => [
                            ['icone' => 'gem', 'quantidade' => 23, 'opcoes' => [23, 32, 22]],
                            ['icone' => 'gem', 'quantidade' => 27, 'opcoes' => [27, 37, 72]],
                            ['icone' => 'gem', 'quantidade' => 34, 'opcoes' => [34, 43, 24]],
                            ['icone' => 'gem', 'quantidade' => 45, 'opcoes' => [45, 54, 35]],
                        ]],
                    ],
                    [
                        'tipo' => 'ordenar',
                        'titulo' => 'Montes em ordem',
                        'instrucao' => 'Coloque os montes em ordem, do menor ao maior. Toque num número para ouvir.',
                        'config' => [
                            'instrucao' => 'do menor ao maior',
                            'modo' => 'numeros',
                            'itens' => [['texto' => '20'], ['texto' => '27'], ['texto' => '34'], ['texto' => '43'], ['texto' => '50']],
                            'dica' => 'Olhe primeiro as dezenas: quem tem menos pilhas de 10 vem antes.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Qual tem mais?',
                        'instrucao' => 'Ouça com calma e toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Um monte tem 27 cristais. Outro tem 20. Qual monte tem mais?', 'opcoes' => ['O de 27', 'O de 20', 'Os dois têm igual'], 'correta' => 0, 'dica' => 'Os dois têm 2 pilhas de 10. Quem tem cristais soltos a mais?', 'explicacao' => '27 é maior que 20: são 7 cristais a mais.', 'icone' => 'gem'],
                            ['pergunta' => 'Qual número é maior: 34 ou 43?', 'opcoes' => ['43', '34', 'São iguais'], 'correta' => 0, 'dica' => 'Olhe o primeiro número: ele conta as pilhas de 10.', 'explicacao' => '43 tem 4 pilhas de 10; 34 tem só 3. Então 43 é maior.', 'icone' => 'gem'],
                            ['pergunta' => 'Qual número vem logo depois de 39?', 'opcoes' => ['40', '38', '49'], 'correta' => 0, 'dica' => 'Conte a partir de 39: trinta e nove, ...', 'explicacao' => 'Depois de 39 vem 40: fecha mais uma pilha de 10.', 'icone' => 'gem'],
                        ]],
                    ],
                ],
            ],
            [
                // Reforço de dezenas e unidades com apoio concreto (contar agrupando)
                // antes do símbolo; depois fatos até 20 na reta numérica.
                'slug' => 'matematica-6-pacotes-de-dez',
                'disciplina' => 'matematica',
                'titulo' => 'Pacotes de dez',
                'rotulo' => '46 = 40 + 6',
                'descricao' => 'Lanche para a Gosma em pacotes de 10: dezenas, unidades e contas até 20 na reta.',
                'habilidade_bncc' => 'EF01MA07',
                'fase' => 2,
                'ordem' => 2,
                'publicar' => true,
                'ilustracao' => 'cubo-pilhas',
                'desfecho' => 'Os pacotes de lanche ficaram na entrada da mina. De manhã, estavam vazios. E no chão tinha um coração meio torto, desenhado com gosma!',
                'gancho' => 'A Gosma gostou do lanche. Será que agora ela quer morar perto da tripulação?',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'Lanche para a Gosma',
                        'config' => ['paginas' => [
                            ['texto' => 'A Gosma come pontes e cristais porque está com fome. A tripulação teve uma ideia: fazer biscoitos para ela!', 'icone' => 'cookie'],
                            ['texto' => 'Os biscoitos vão em pacotes de 10. Um pacote fechado é uma dezena. Os biscoitos soltos são as unidades.', 'icone' => 'package', 'ilustracao' => 'cubo-pilhas'],
                            ['texto' => '46 biscoitos são 4 pacotes de 10 e mais 6 soltos: 4 dezenas e 6 unidades.', 'icone' => 'package'],
                        ]],
                    ],
                    [
                        'tipo' => 'contar',
                        'titulo' => 'Pacotes e soltos',
                        'instrucao' => 'Conte os pacotes de 10 e os biscoitos soltos. Depois toque no número.',
                        'config' => ['itens' => [
                            ['icone' => 'cookie', 'quantidade' => 16, 'opcoes' => [16, 61, 26]],
                            ['icone' => 'cookie', 'quantidade' => 23],
                            ['icone' => 'cookie', 'quantidade' => 30],
                            ['icone' => 'cookie', 'quantidade' => 46, 'opcoes' => [46, 64, 36]],
                        ]],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Número e pacotes',
                        'instrucao' => 'Ligue cada número aos pacotes e biscoitos soltos que ele tem.',
                        'config' => [
                            'instrucao' => 'ligue cada número ao que ele tem',
                            'pares' => [
                                ['a' => '12', 'b' => '1 dezena e 2 unidades'],
                                ['a' => '21', 'b' => '2 dezenas e 1 unidade'],
                                ['a' => '30', 'b' => '3 dezenas'],
                                ['a' => '46', 'b' => '4 dezenas e 6 unidades'],
                            ],
                            'dica' => 'O primeiro número conta os pacotes de 10. O segundo conta os soltos.',
                        ],
                    ],
                    [
                        'tipo' => 'somar_subtrair',
                        'titulo' => 'Contas na reta',
                        'instrucao' => 'Use a reta: ande para a frente para juntar e para trás para tirar.',
                        'config' => ['itens' => [
                            ['a' => 10, 'b' => 6, 'operacao' => '+'],
                            ['a' => 13, 'b' => 4, 'operacao' => '+'],
                            ['a' => 8, 'b' => 7, 'operacao' => '+'],
                            ['a' => 17, 'b' => 5, 'operacao' => '-'],
                            ['a' => 20, 'b' => 10, 'operacao' => '-'],
                        ], 'apoio' => 'reta'],
                    ],
                ],
            ],
            [
                'slug' => 'matematica-7-formas-do-planeta-cubo',
                'disciplina' => 'matematica',
                'titulo' => 'Formas do Planeta Cubo',
                'rotulo' => 'formas',
                'descricao' => 'Cubo, esfera, cilindro e cone: as formas da toca nova da Gosma e das coisas de casa.',
                'habilidade_bncc' => 'EF01MA13',
                'fase' => 2,
                'ordem' => 3,
                'publicar' => true,
                'desfecho' => 'A toca nova da Gosma ficou pronta: paredes de cubos, colunas de cilindros, bolas de esfera para brincar e um telhado de cone. A Gosma pulou de alegria!',
                'gancho' => 'A tripulação quer convidar a Gosma para visitar a nave. Que dia será bom? Vamos olhar o calendário.',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'A toca da Gosma',
                        'config' => ['paginas' => [
                            ['texto' => 'A Gosma mora sozinha num buraco frio da mina. A tripulação resolveu construir uma toca para ela.', 'icone' => 'house'],
                            ['texto' => 'No Planeta Cubo não tem só cubos! Tem esfera, que rola como bola; cilindro, como uma lata; e cone, como a casquinha de sorvete.', 'icone' => 'cone'],
                            ['texto' => 'Olhe as coisas da sua casa: o dado parece um cubo, a bola é uma esfera e o copo parece um cilindro.', 'icone' => 'dice-5'],
                        ]],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'Forma e objeto',
                        'instrucao' => 'Ligue cada forma a um objeto que se parece com ela. Toque para ouvir o nome.',
                        'config' => [
                            'instrucao' => 'ligue cada forma ao objeto parecido',
                            'pares' => [
                                ['a' => 'cubo', 'b' => 'dado', 'icone_a' => 'box', 'icone_b' => 'dice-5'],
                                ['a' => 'esfera', 'b' => 'bola', 'icone_a' => 'circle', 'icone_b' => 'volleyball'],
                                ['a' => 'cilindro', 'b' => 'lata', 'icone_a' => 'cylinder'],
                                ['a' => 'cone', 'b' => 'casquinha de sorvete', 'icone_a' => 'cone', 'icone_b' => 'ice-cream-cone'],
                            ],
                            'dica' => 'A esfera rola para todo lado. O cone tem uma ponta.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Qual é a forma?',
                        'instrucao' => 'Ouça e toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Qual forma rola para todo lado e não tem ponta nenhuma?', 'opcoes' => ['A esfera', 'O cubo', 'O cone'], 'correta' => 0, 'dica' => 'Pense numa bola.', 'explicacao' => 'A esfera é redondinha como a bola: rola para todo lado.', 'icone' => 'circle'],
                            ['pergunta' => 'Qual objeto parece um cilindro?', 'opcoes' => ['Uma lata', 'Um dado', 'Uma bola'], 'correta' => 0, 'dica' => 'O cilindro é redondo em cima e embaixo, e fica em pé.', 'explicacao' => 'A lata parece um cilindro.', 'icone' => 'cylinder'],
                            ['pergunta' => 'O chapéu de festa parece qual forma?', 'opcoes' => ['O cone', 'A esfera', 'O cubo'], 'correta' => 0, 'dica' => 'Ele termina numa ponta, como a casquinha de sorvete.', 'explicacao' => 'O chapéu de festa parece um cone.', 'icone' => 'cone'],
                        ]],
                    ],
                    [
                        'tipo' => 'verdadeiro_falso',
                        'titulo' => 'Verdadeiro ou falso?',
                        'instrucao' => 'Toque em verdadeiro ou falso.',
                        'config' => ['itens' => [
                            ['frase' => 'A bola tem forma de esfera.', 'correta' => true, 'dica' => 'A esfera é redondinha.', 'explicacao' => 'A bola é uma esfera.'],
                            ['frase' => 'O dado tem forma de cone.', 'correta' => false, 'dica' => 'O dado não tem ponta.', 'explicacao' => 'O dado parece um cubo.'],
                            ['frase' => 'Uma caixa de sapato parece um bloco, como os do Planeta Cubo.', 'correta' => true, 'dica' => 'Ela tem lados retos, como os blocos.', 'explicacao' => 'A caixa parece um bloco retangular.'],
                        ]],
                    ],
                ],
            ],
            [
                'slug' => 'matematica-8-o-calendario-da-nave',
                'disciplina' => 'matematica',
                'titulo' => 'O calendário da nave',
                'rotulo' => 'semana',
                'descricao' => 'Os dias da semana e as partes do dia para marcar uma festa no calendário.',
                'habilidade_bncc' => 'EF01MA17',
                'fase' => 2,
                'ordem' => 4,
                'publicar' => true,
                'desfecho' => 'A festa está marcada no calendário da nave: sábado, à tarde! Só falta entregar o convite para a Gosma.',
                'gancho' => 'Será que a Gosma vai aceitar o convite para a festa?',
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'O calendário',
                        'config' => ['paginas' => [
                            ['texto' => 'A tripulação quer fazer uma festa para a Gosma. Para ninguém esquecer, vai marcar no calendário da nave.', 'icone' => 'calendar'],
                            ['texto' => 'A semana tem 7 dias: domingo, segunda, terça, quarta, quinta, sexta e sábado. Depois do sábado, começa tudo de novo.', 'icone' => 'calendar'],
                            ['texto' => 'Cada dia tem partes: a manhã, quando o sol nasce; a tarde, depois do almoço; e a noite, quando a lua aparece. A festa vai ser no sábado, à tarde.', 'icone' => 'sun'],
                        ]],
                    ],
                    [
                        'tipo' => 'ordenar',
                        'titulo' => 'Os dias da semana',
                        'instrucao' => 'Coloque os dias da semana em ordem. Toque num dia para ouvir o nome.',
                        'config' => [
                            'instrucao' => 'do domingo ao sábado',
                            'modo' => 'tempo',
                            'itens' => [['texto' => 'domingo'], ['texto' => 'segunda-feira'], ['texto' => 'terça-feira'], ['texto' => 'quarta-feira'], ['texto' => 'quinta-feira'], ['texto' => 'sexta-feira'], ['texto' => 'sábado']],
                            'dica' => 'A semana começa no domingo. Segunda, terça, quarta, quinta e sexta vêm em ordem, e o sábado fecha a semana.',
                        ],
                    ],
                    [
                        'tipo' => 'parear',
                        'titulo' => 'As partes do dia',
                        'instrucao' => 'Ligue cada parte do dia ao que acontece nela.',
                        'config' => [
                            'instrucao' => 'ligue cada parte do dia ao que acontece',
                            'pares' => [
                                ['a' => 'manhã', 'b' => 'o sol nasce', 'icone_b' => 'sunrise'],
                                ['a' => 'tarde', 'b' => 'vem depois do almoço', 'icone_b' => 'utensils'],
                                ['a' => 'noite', 'b' => 'a lua aparece no céu', 'icone_b' => 'moon'],
                            ],
                            'dica' => 'O dia começa de manhã e termina à noite.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Dias e semanas',
                        'instrucao' => 'Ouça e toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Quantos dias tem uma semana?', 'opcoes' => ['7', '5', '10'], 'correta' => 0, 'dica' => 'Conte de domingo até sábado.', 'explicacao' => 'A semana tem 7 dias.', 'icone' => 'calendar'],
                            ['pergunta' => 'Qual dia vem logo depois da sexta-feira?', 'opcoes' => ['Sábado', 'Domingo', 'Quinta-feira'], 'correta' => 0, 'dica' => 'É o dia da festa da Gosma.', 'explicacao' => 'Depois da sexta-feira vem o sábado.', 'icone' => 'calendar'],
                            ['pergunta' => 'A festa vai ser depois do almoço. Em que parte do dia?', 'opcoes' => ['À tarde', 'De manhã', 'À noite'], 'correta' => 0, 'dica' => 'A manhã vem antes do almoço.', 'explicacao' => 'Depois do almoço é a tarde.', 'icone' => 'sun'],
                        ]],
                    ],
                ],
            ],
        ];
    }
}
