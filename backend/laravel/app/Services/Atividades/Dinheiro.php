<?php

namespace App\Services\Atividades;

use App\Models\AulaAtividade;
use App\Services\Atividades\Suporte\Mensagens;
use Illuminate\Validation\ValidationException;

/**
 * Dinheiro (EF01MA19; no 2º ano, EF02MA20): juntar moedas e notas para pagar um preço exato. A
 * criança vê o preço e um conjunto de moedas/notas (em reais inteiros) e
 * escolhe algumas; qualquer combinação que some o preço vale.
 * Resposta `{ item, escolhidas: [ids das moedas] }`.
 *
 * config: { itens: [ { id?, preco: 1..200, moedas: [1,1,2,5,10], dica? } ] }
 */
final class Dinheiro extends Generico
{
    public const VALORES = [1, 2, 5, 10, 20, 50, 100];

    protected function regras(): array
    {
        return [
            'itens' => ['required', 'array', 'min:1', 'max:10'],
            'itens.*.id' => ['nullable', 'string', 'max:40'],
            'itens.*.preco' => ['required', 'integer', 'min:1', 'max:200'],
            'itens.*.moedas' => ['required', 'array', 'min:2', 'max:12'],
            'itens.*.moedas.*' => ['integer', 'in:'.implode(',', self::VALORES)],
            'itens.*.dica' => ['nullable', 'string', 'max:200'],
        ];
    }

    public static function tipo(): string
    {
        return 'dinheiro';
    }

    protected function normalizar(array $config): array
    {
        $itens = [];

        foreach (array_values($config['itens']) as $i => $item) {
            $moedas = array_values(array_map('intval', $item['moedas']));
            sort($moedas);
            $preco = (int) $item['preco'];

            if (self::combinacao($moedas, $preco) === null) {
                throw ValidationException::withMessages(["itens.$i.moedas" => "Nenhuma combinação dessas moedas soma {$preco}."]);
            }

            $itens[] = [
                'id' => ($item['id'] ?? null) ?: 'd'.($i + 1),
                'preco' => $preco,
                'moedas' => $moedas,
                'dica' => $item['dica'] ?? null,
            ];
        }

        return ['itens' => $itens];
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        $config = $this->normalizar($atividade->configArray());

        return [
            'itens' => array_map(fn ($item) => [
                'id' => $item['id'],
                'preco' => $item['preco'],
                'moedas' => self::moedasComId($item['moedas']),
            ], $config['itens']),
        ];
    }

    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade
    {
        $config = $this->normalizar($config);
        $itemId = $this->texto($resposta, 'item');
        $item = collect($config['itens'])->firstWhere('id', $itemId) ?? $config['itens'][0];
        $moedas = self::moedasComId($item['moedas']);
        $porId = array_column($moedas, 'valor', 'id');
        $escolhidas = array_values(array_unique(array_map('strval', (array) ($resposta['escolhidas'] ?? []))));
        $soma = array_sum(array_map(fn ($id) => (int) ($porId[$id] ?? 0), $escolhidas));
        $revisao = [[
            'chave' => sprintf('dinheiro:%d:%s', $item['preco'], implode('-', $item['moedas'])),
            'disciplina' => (string) $contexto->aula->disciplina,
            'dados' => ['tipo' => self::tipo(), 'config' => ['itens' => [$item]]],
        ]];

        if ($soma === $item['preco'] && $escolhidas !== []) {
            return ResultadoAtividade::acerto("isso! {$soma} reais, o preço certo.", (int) config('teia.xp.atividade_item', 1), $item['id'], $revisao, ['soma' => $soma]);
        }

        $certa = self::combinacao($item['moedas'], $item['preco']) ?? [];
        $idsCertos = [];
        $usadas = [];

        foreach ($certa as $valor) {
            foreach ($moedas as $m) {
                if ($m['valor'] === $valor && ! in_array($m['id'], $usadas, true)) {
                    $usadas[] = $m['id'];
                    $idsCertos[] = $m['id'];
                    break;
                }
            }
        }

        return ResultadoAtividade::erro(
            Mensagens::ERRO,
            $item['dica'] ?: self::dica($soma, $item['preco']),
            ['escolhidas' => $idsCertos, 'valores' => $certa, 'preco' => $item['preco']],
            $item['id'],
            $revisao,
            ['soma' => $soma],
        );
    }

    public static function dica(int $soma, int $preco): string
    {
        if ($soma === 0) {
            return "toque nas moedas até juntar {$preco} reais.";
        }

        if ($soma < $preco) {
            $falta = $preco - $soma;

            return "você juntou {$soma}; ".($falta === 1 ? 'falta 1 real.' : "faltam {$falta} reais.");
        }

        $sobra = $soma - $preco;

        return 'passou '.($sobra === 1 ? '1 real' : "{$sobra} reais").'. tire uma moeda.';
    }

    /**
     * A combinação (subconjunto) com MENOS moedas que soma o preço, ou null.
     * 0/1 por moeda: cada uma só pode ser usada uma vez.
     *
     * @param  list<int>  $moedas
     * @return list<int>|null
     */
    public static function combinacao(array $moedas, int $preco): ?array
    {
        /** @var array<int, list<int>> $melhor soma => índices das moedas usadas */
        $melhor = [0 => []];

        foreach ($moedas as $i => $valor) {
            for ($s = $preco; $s >= $valor; $s--) {
                if (isset($melhor[$s - $valor]) && (! isset($melhor[$s]) || count($melhor[$s - $valor]) + 1 < count($melhor[$s]))) {
                    $melhor[$s] = [...$melhor[$s - $valor], $i];
                }
            }
        }

        if (! isset($melhor[$preco])) {
            return null;
        }

        $valores = array_map(fn ($i) => (int) $moedas[$i], $melhor[$preco]);
        sort($valores);

        return $valores;
    }

    /**
     * @param  list<int>  $moedas
     * @return list<array{id: string, valor: int}>
     */
    private static function moedasComId(array $moedas): array
    {
        return array_map(fn ($valor, $i) => ['id' => 'm'.($i + 1), 'valor' => (int) $valor], $moedas, array_keys($moedas));
    }
}
