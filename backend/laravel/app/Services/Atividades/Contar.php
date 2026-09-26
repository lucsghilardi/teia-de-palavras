<?php

namespace App\Services\Atividades;

use App\Models\AulaAtividade;
use App\Services\Atividades\Suporte\Embaralhador;
use App\Services\Atividades\Suporte\Mensagens;

/**
 * Contar objetos (concreto → abstrato): a criança vê `quantidade` ícones em
 * grupos de 10 e escolhe o número. Resposta `{ item, valor }`.
 *
 * config: { itens: [ { id?, icone, quantidade: 1..100, opcoes?: [int…] } ] }
 */
final class Contar extends Generico
{
    public static function tipo(): string
    {
        return 'contar';
    }

    protected function regras(): array
    {
        return [
            'itens' => ['required', 'array', 'min:1', 'max:10'],
            'itens.*.id' => ['nullable', 'string', 'max:40'],
            'itens.*.icone' => ['required', 'string', 'max:40'],
            'itens.*.quantidade' => ['required', 'integer', 'min:1', 'max:100'],
            'itens.*.opcoes' => ['nullable', 'array', 'min:2', 'max:5'],
            'itens.*.opcoes.*' => ['integer', 'min:0', 'max:999'],
        ];
    }

    protected function normalizar(array $config): array
    {
        $itens = [];

        foreach (array_values($config['itens']) as $i => $item) {
            $quantidade = (int) $item['quantidade'];
            $opcoes = array_values(array_unique(array_map('intval', $item['opcoes'] ?? [])));

            if ($opcoes === []) {
                $opcoes = self::opcoesPara($quantidade);
            }

            if (! in_array($quantidade, $opcoes, true)) {
                $opcoes[] = $quantidade;
            }

            $itens[] = [
                'id' => ($item['id'] ?? null) ?: 'c'.($i + 1),
                'icone' => trim($item['icone']),
                'quantidade' => $quantidade,
                'opcoes' => $opcoes,
            ];
        }

        return ['itens' => $itens];
    }

    /** @return list<int> */
    public static function opcoesPara(int $quantidade): array
    {
        $passo = $quantidade >= 20 ? 10 : ($quantidade >= 10 ? 2 : 1);
        $candidatas = [$quantidade, $quantidade + $passo, max(0, $quantidade - $passo)];

        if ($quantidade - $passo < 0) {
            $candidatas[2] = $quantidade + 2 * $passo;
        }

        return array_values(array_unique($candidatas));
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        $config = $this->normalizar($atividade->configArray());

        return [
            'itens' => array_map(fn ($item, $i) => [
                'id' => $item['id'],
                'icone' => $item['icone'],
                'quantidade' => $item['quantidade'],
                'opcoes' => Embaralhador::embaralhar($item['opcoes'], $contexto->semente + $i),
            ], $config['itens'], array_keys($config['itens'])),
        ];
    }

    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade
    {
        $config = $this->normalizar($config);
        $itemId = $this->texto($resposta, 'item');
        $item = collect($config['itens'])->firstWhere('id', $itemId) ?? $config['itens'][0];
        $valor = (int) ($resposta['valor'] ?? -1);
        $revisao = [[
            'chave' => sprintf('contar:%d', $item['quantidade']),
            'disciplina' => (string) $contexto->aula->disciplina,
            'dados' => ['tipo' => self::tipo(), 'config' => ['itens' => [$item]]],
        ]];

        if ($valor === $item['quantidade']) {
            return ResultadoAtividade::acerto(Mensagens::acerto($contexto->semente), (int) config('teia.xp.atividade_item', 1), $item['id'], $revisao);
        }

        $dica = $item['quantidade'] >= 10
            ? 'conte de 10 em 10 e depois os que sobram.'
            : 'toque em cada um enquanto conta em voz alta.';

        return ResultadoAtividade::erro(Mensagens::ERRO, $dica, ['valor' => $item['quantidade']], $item['id'], $revisao);
    }
}
