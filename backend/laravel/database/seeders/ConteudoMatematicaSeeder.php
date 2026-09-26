<?php

namespace Database\Seeders;

use App\Enums\Disciplina;
use App\Models\Aula;
use App\Services\Aulas\AulaEditorService;
use Illuminate\Database\Seeder;

/**
 * Missões de Matemática (BNCC 2º ano), no universo da nave Teia. Cada missão
 * é uma sequência de atividades em JSON validadas pelo registro de tipos.
 * Idempotente: missão que já existe (pelo slug) não é tocada.
 */
class ConteudoMatematicaSeeder extends Seeder
{
    public function run(AulaEditorService $editor): void
    {
        $anterior = null;

        foreach (self::missoes() as $dados) {
            $existente = Aula::where('slug', $dados['slug'])->first();

            if ($existente !== null) {
                $anterior = $existente;

                continue;
            }

            $aula = Aula::create([
                'slug' => $dados['slug'],
                'disciplina' => Disciplina::Matematica->value,
                'titulo' => $dados['titulo'],
                'rotulo' => $dados['rotulo'],
                'descricao' => $dados['descricao'],
                'habilidade_bncc' => $dados['habilidade_bncc'],
                'fase' => $dados['fase'],
                'ordem' => $dados['ordem'],
                'status' => Aula::STATUS_RASCUNHO,
            ]);

            $editor->atualizar($aula, [
                'titulo' => $dados['titulo'],
                'fase' => $dados['fase'],
                'pre_requisito_aula_id' => $anterior?->id,
                'atividades' => $dados['atividades'],
            ]);

            if ($dados['publicar']) {
                $editor->publicar($aula);
            }

            $anterior = $aula;
        }
    }

    /** @return list<array<string, mixed>> */
    public static function missoes(): array
    {
        return [
            [
                'slug' => 'matematica-1-somar-para-decolar',
                'titulo' => 'Somar para decolar',
                'rotulo' => '7 + 5',
                'descricao' => 'Contar, somar e subtrair até 20 para abastecer a nave.',
                'habilidade_bncc' => 'EF02MA05',
                'fase' => 1,
                'ordem' => 1,
                'publicar' => true,
                'atividades' => [
                    [
                        'tipo' => 'historia',
                        'titulo' => 'A base lunar',
                        'config' => ['paginas' => [
                            ['texto' => 'A nave Teia vai decolar da base lunar. Antes, a tripulação confere os suprimentos.', 'icone' => 'rocket'],
                            ['texto' => 'Chegaram 7 caixas de água e mais 5 de comida. Quantas caixas ao todo? É isso que você vai descobrir.', 'icone' => 'package'],
                        ]],
                    ],
                    [
                        'tipo' => 'contar',
                        'titulo' => 'Contar os suprimentos',
                        'instrucao' => 'Conte e toque no número certo.',
                        'config' => ['itens' => [
                            ['icone' => 'star', 'quantidade' => 12],
                            ['icone' => 'rocket', 'quantidade' => 7],
                            ['icone' => 'moon', 'quantidade' => 15],
                        ]],
                    ],
                    [
                        'tipo' => 'somar_subtrair',
                        'titulo' => 'Somar para abastecer',
                        'instrucao' => 'Junte as caixas e escolha o total.',
                        'config' => ['gerar' => ['quantidade' => 4, 'maximo' => 20, 'operacoes' => ['+']], 'apoio' => 'icones'],
                    ],
                    [
                        'tipo' => 'somar_subtrair',
                        'titulo' => 'Desviar dos asteroides',
                        'instrucao' => 'Tire os asteroides que passaram e escolha quantos sobraram.',
                        'config' => ['itens' => [
                            ['a' => 12, 'b' => 5, 'operacao' => '-'],
                            ['a' => 18, 'b' => 9, 'operacao' => '-'],
                            ['a' => 15, 'b' => 7, 'operacao' => '-'],
                        ], 'apoio' => 'reta'],
                    ],
                    [
                        'tipo' => 'escolha',
                        'titulo' => 'Problemas da base',
                        'instrucao' => 'Leia com calma e toque na resposta.',
                        'config' => ['itens' => [
                            [
                                'pergunta' => 'Na base havia 8 foguetes e chegaram mais 6. Quantos foguetes há agora?',
                                'opcoes' => ['14', '12', '16'],
                                'correta' => 0,
                                'dica' => 'Some 8 com 6.',
                                'explicacao' => '8 + 6 = 14.',
                            ],
                            [
                                'pergunta' => 'Havia 15 estrelas acesas no painel e 5 apagaram. Quantas ficaram acesas?',
                                'opcoes' => ['10', '20', '9'],
                                'correta' => 0,
                                'dica' => 'Tire 5 de 15.',
                                'explicacao' => '15 - 5 = 10.',
                            ],
                        ]],
                    ],
                ],
            ],
        ];
    }
}
