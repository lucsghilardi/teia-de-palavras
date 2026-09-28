<?php

namespace App\Services\Conteudo;

use App\Enums\Disciplina;
use App\Models\Aula;
use App\Services\Aulas\AulaEditorService;
use App\Services\Palavras\SugestorFamilia;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Grava uma missão descrita por um seeder (dados estáticos) usando o mesmo
 * editor do CMS, então tudo passa pela validação dos avaliadores. Os seeders
 * só criam o que não existe; `teia:reaplicar-conteudo --forcar` sobrescreve.
 *
 * Ao sobrescrever, a atividade (e a página) que continua na mesma posição com
 * o mesmo tipo é atualizada no lugar: as respostas e a revisão das crianças
 * nela sobrevivem. Só some o histórico de posições cujo tipo mudou.
 *
 * Formato de $dados: slug, disciplina, titulo, rotulo?, descricao?, habilidade_bncc?,
 * ilustracao?, desfecho?, gancho?, fase, ordem, publicar, atividades[] (cada uma
 * com ilustracao? opcional) e, em Português, palavra, silabas, historia (textos
 * ou [texto, ilustracao]), perguntas (textos) e palavras.
 */
final class AplicadorConteudo
{
    public function __construct(private readonly AulaEditorService $editor) {}

    /**
     * @param  array<string, mixed>  $dados
     */
    public function aplicar(array $dados, ?Aula $anterior, bool $sobrescrever = false): Aula
    {
        $existente = Aula::where('slug', $dados['slug'])->first();

        if ($existente !== null && ! $sobrescrever) {
            return $existente;
        }

        // Tudo ou nada: um config inválido não deixa a missão pela metade no banco.
        return DB::transaction(function () use ($dados, $anterior, $existente) {
            $disciplina = Disciplina::from($dados['disciplina'] ?? Disciplina::Portugues->value);
            $portugues = $disciplina->temPalavraGeradora();

            $aula = $existente ?? Aula::create([
                'slug' => $dados['slug'],
                'disciplina' => $disciplina->value,
                'titulo' => $dados['titulo'],
                'fase' => $dados['fase'],
                'ordem' => $dados['ordem'],
                'palavra_geradora' => $portugues ? $dados['palavra'] : null,
                'status' => Aula::STATUS_RASCUNHO,
            ]);

            $aula->update(['ordem' => $dados['ordem']]);

            $campos = [
                'titulo' => $dados['titulo'],
                'fase' => $dados['fase'],
                'pre_requisito_aula_id' => $anterior?->id,
                'rotulo' => $dados['rotulo'] ?? null,
                'descricao' => $dados['descricao'] ?? null,
                'habilidade_bncc' => $dados['habilidade_bncc'] ?? null,
                'ilustracao' => $dados['ilustracao'] ?? null,
                'desfecho' => $dados['desfecho'] ?? null,
                'gancho' => $dados['gancho'] ?? null,
                'atividades' => $this->comIdsExistentes(
                    array_map(fn (array $a) => ['ilustracao' => null, ...$a], $dados['atividades']),
                    $existente?->atividades()->orderBy('ordem')->get(['id', 'tipo'])->all() ?? [],
                    fn (array $item, $existenteNaPosicao) => $existenteNaPosicao->tipo === $item['tipo'],
                ),
            ];

            if ($portugues) {
                $campos += [
                    'palavra_geradora' => $dados['palavra'],
                    'silabas' => array_map(fn ($s) => ['texto' => $s[0], 'familia' => $s[1] ?? SugestorFamilia::para($s[0])], $dados['silabas']),
                    'historia_paginas' => $this->comIdsExistentes(
                        array_map(fn ($t) => is_array($t)
                            ? ['texto' => $t['texto'], 'ilustracao' => $t['ilustracao'] ?? null]
                            : ['texto' => $t, 'ilustracao' => null], $dados['historia']),
                        $existente?->historiaPaginas()->orderBy('ordem')->get(['id'])->all() ?? [],
                    ),
                    'perguntas' => $this->comIdsExistentes(
                        array_map(fn ($t) => ['texto' => $t], $dados['perguntas'] ?? []),
                        $existente?->perguntas()->orderBy('ordem')->get(['id'])->all() ?? [],
                    ),
                    'palavras' => array_map(fn ($p) => [
                        'palavra' => is_array($p) ? $p[0] : $p,
                        'silabas' => [],
                        'destaque' => is_array($p) && ($p[1] ?? false),
                    ], $dados['palavras']),
                ];
            }

            $this->editor->atualizar($aula, $campos);

            if (($dados['publicar'] ?? false) && ! $aula->fresh()->estaPublicada()) {
                $this->editor->publicar($aula);
            }

            return $aula->fresh();
        });
    }

    /**
     * Casa cada item do seeder com o registro que já ocupa a mesma posição
     * (e passa no critério), para o editor atualizar no lugar em vez de
     * apagar e recriar.
     *
     * @param  list<array<string, mixed>>  $itens
     * @param  list<Model>  $existentes  na ordem atual
     * @param  (callable(array<string, mixed>, Model): bool)|null  $combina
     * @return list<array<string, mixed>>
     */
    private function comIdsExistentes(array $itens, array $existentes, ?callable $combina = null): array
    {
        foreach (array_values($itens) as $posicao => $item) {
            $existente = $existentes[$posicao] ?? null;

            if ($existente !== null && ($combina === null || $combina($item, $existente))) {
                $itens[$posicao]['id'] = $existente->id;
            }
        }

        return $itens;
    }

    /**
     * Aplica uma lista encadeada (cada missão tem a anterior como pré-requisito).
     *
     * @param  list<array<string, mixed>>  $missoes
     * @return list<Aula>
     */
    public function aplicarLista(array $missoes, bool $sobrescrever = false, ?callable $filtro = null): array
    {
        $anterior = null;
        $aplicadas = [];

        foreach ($missoes as $dados) {
            if ($filtro !== null && ! $filtro($dados)) {
                // Fora da seleção: só serve de elo da corrente, se já existir.
                $anterior = Aula::where('slug', $dados['slug'])->first() ?? $anterior;

                continue;
            }

            $anterior = $this->aplicar($dados, $anterior, $sobrescrever);
            $aplicadas[] = $anterior;
        }

        return $aplicadas;
    }
}
