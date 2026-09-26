<?php

namespace App\Services\Atividades;

use App\Models\AulaAtividade;
use App\Services\Atividades\Suporte\Embaralhador;
use App\Services\Atividades\Suporte\Mensagens;

/**
 * Ligar pares (palavra ↔ figura, número ↔ quantidade, pessoa ↔ trabalho).
 * A criança recebe as duas colunas embaralhadas e responde um par por vez:
 * `{ item: idDaEsquerda, b: idDaDireita }`.
 *
 * config: { instrucao?, pares: [ { a, b, icone_a?, icone_b? } ], dica? }
 */
final class Parear extends Generico
{
    public static function tipo(): string
    {
        return 'parear';
    }

    protected function regras(): array
    {
        return [
            'instrucao' => ['nullable', 'string', 'max:200'],
            'pares' => ['required', 'array', 'min:2', 'max:8'],
            'pares.*.a' => ['required', 'string', 'max:120'],
            'pares.*.b' => ['required', 'string', 'max:120'],
            'pares.*.icone_a' => ['nullable', 'string', 'max:40'],
            'pares.*.icone_b' => ['nullable', 'string', 'max:40'],
            'dica' => ['nullable', 'string', 'max:200'],
        ];
    }

    protected function normalizar(array $config): array
    {
        return [
            'instrucao' => $config['instrucao'] ?? null,
            'pares' => array_values(array_map(fn ($p) => [
                'a' => trim($p['a']), 'b' => trim($p['b']),
                'icone_a' => $p['icone_a'] ?? null, 'icone_b' => $p['icone_b'] ?? null,
            ], $config['pares'])),
            'dica' => $config['dica'] ?? null,
        ];
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        $config = $this->normalizar($atividade->configArray());
        [$esquerda, $direita] = $this->colunas($config['pares']);

        return [
            'pergunta' => $config['instrucao'],
            'esquerda' => Embaralhador::embaralhar($esquerda, $contexto->semente),
            'direita' => Embaralhador::embaralharDiferente($direita, $contexto->semente + 1),
        ];
    }

    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade
    {
        $config = $this->normalizar($config);
        [$esquerda, $direita] = $this->colunas($config['pares']);
        $idA = $this->texto($resposta, 'item');
        $idB = $this->texto($resposta, 'b');
        $indice = array_search($idA, array_column($esquerda, 'id'), true);

        if ($indice === false) {
            return ResultadoAtividade::erro(Mensagens::ERRO, 'toque primeiro num item da esquerda.', null, $idA ?: 'unico');
        }

        $par = $config['pares'][$indice];
        $revisao = [[
            'chave' => sprintf('parear:%d:%s', $contexto->aula->id, Embaralhador::id($par['a'], $par['b'])),
            'disciplina' => (string) $contexto->aula->disciplina,
            'dados' => ['tipo' => self::tipo(), 'config' => ['pares' => $this->paresDeRevisao($config['pares'], $indice), 'dica' => $config['dica']]],
        ]];

        if ($idB === $direita[$indice]['id']) {
            return ResultadoAtividade::acerto(Mensagens::acerto($contexto->semente + $indice), (int) config('teia.xp.atividade_item', 1), $idA, $revisao);
        }

        return ResultadoAtividade::erro(
            Mensagens::ERRO,
            $config['dica'] ?: 'pense no que combina com '.$par['a'].'.',
            ['b' => $direita[$indice]['id'], 'texto' => $par['b']],
            $idA,
            $revisao,
        );
    }

    /**
     * @param  list<array{a: string, b: string, icone_a: ?string, icone_b: ?string}>  $pares
     * @return array{0: list<array{id: string, texto: string, icone: ?string}>, 1: list<array{id: string, texto: string, icone: ?string}>}
     */
    private function colunas(array $pares): array
    {
        $esquerda = [];
        $direita = [];

        foreach ($pares as $i => $par) {
            $esquerda[] = ['id' => Embaralhador::id('a', (string) $i, $par['a']), 'texto' => $par['a'], 'icone' => $par['icone_a']];
            $direita[] = ['id' => Embaralhador::id('b', (string) $i, $par['b']), 'texto' => $par['b'], 'icone' => $par['icone_b']];
        }

        return [$esquerda, $direita];
    }

    /**
     * Revisão de um par: ele mais um "distrator" (mínimo de 2 pares no config).
     *
     * @param  list<array<string, mixed>>  $pares
     * @return list<array<string, mixed>>
     */
    private function paresDeRevisao(array $pares, int $indice): array
    {
        $outro = $pares[($indice + 1) % count($pares)];

        return [$pares[$indice], $outro];
    }
}
