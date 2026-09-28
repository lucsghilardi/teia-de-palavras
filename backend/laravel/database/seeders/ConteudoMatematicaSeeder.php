<?php

namespace Database\Seeders;

use App\Services\Conteudo\AplicadorConteudo;
use Illuminate\Database\Seeder;

/**
 * Missões de Matemática (BNCC 1º ano), no universo da nave Teia. Cada missão
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
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'A base lunar',
                        'config' => ['paginas' => [
                            ['texto' => 'A nave Teia vai decolar da base lunar. Antes, a tripulação confere os suprimentos.', 'icone' => 'rocket'],
                            ['texto' => 'Chegaram 4 caixas de água e mais 3 de comida. Quantas caixas ao todo? É isso que você vai descobrir.', 'icone' => 'package'],
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
                'slug' => 'matematica-2-contar-ate-100',
                'disciplina' => 'matematica',
                'titulo' => 'Contar até 100',
                'rotulo' => '1, 2, 3',
                'descricao' => 'Contar, comparar e ordenar números até 100 com o radar da nave.',
                'habilidade_bncc' => 'EF01MA04',
                'fase' => 1,
                'ordem' => 2,
                'publicar' => true,
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'O radar',
                        'config' => ['paginas' => [
                            ['texto' => 'O radar da nave Teia contou estrelas a noite inteira. Agora é a sua vez de conferir a contagem.', 'icone' => 'radar'],
                            ['texto' => 'Quando der, conte de 10 em 10: 10, 20, 30... É bem mais rápido do que contar de um em um.', 'icone' => 'hash'],
                        ]],
                    ],
                    [
                        'tipo' => 'contar',
                        'titulo' => 'Conferir o radar',
                        'instrucao' => 'Conte em grupos de 10 e toque no número certo.',
                        'config' => ['itens' => [
                            ['icone' => 'star', 'quantidade' => 23],
                            ['icone' => 'moon', 'quantidade' => 41],
                            ['icone' => 'rocket', 'quantidade' => 68],
                            ['icone' => 'satellite', 'quantidade' => 90],
                        ]],
                    ],
                    [
                        'tipo' => 'ordenar',
                        'titulo' => 'Do menor ao maior',
                        'instrucao' => 'Coloque os números em ordem, do menor ao maior.',
                        'config' => [
                            'instrucao' => 'do menor ao maior',
                            'modo' => 'numeros',
                            'itens' => [['texto' => '12'], ['texto' => '25'], ['texto' => '47'], ['texto' => '63'], ['texto' => '88']],
                            'dica' => 'Comece pelo número menor. Olhe primeiro as dezenas.',
                        ],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Antes e depois',
                        'instrucao' => 'Toque na resposta.',
                        'config' => ['itens' => [
                            ['pergunta' => 'Qual número vem logo depois de 39?', 'opcoes' => ['40', '38', '49'], 'correta' => 0, 'dica' => 'Conte a partir de 39: 39, 40.', 'explicacao' => 'Depois de 39 vem 40.'],
                            ['pergunta' => 'Qual desses números é o maior?', 'opcoes' => ['71', '17', '70'], 'correta' => 0, 'dica' => 'Olhe primeiro as dezenas; se empatar, as unidades.', 'explicacao' => '71 tem 7 dezenas e 1 unidade: é o maior.'],
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
        ];
    }
}
