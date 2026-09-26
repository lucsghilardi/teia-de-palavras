<?php

namespace App\Services\Atividades;

use App\Models\AulaAtividade;
use App\Services\Atividades\Suporte\Embaralhador;
use App\Services\Atividades\Suporte\Mensagens;

/**
 * Ordenar itens (sequência de ações, linha do tempo, números). A ordem do
 * config é a correta; a criança recebe os itens embaralhados e responde
 * `{ item: "unico", ordem: [ids…] }`. `linha_do_tempo` usa esta classe.
 *
 * config: { instrucao?, modo?: sequencia|tempo|numeros, itens: [ { texto, icone? } ], dica? }
 */
final class Ordenar extends Generico
{
    public static function tipo(): string
    {
        return 'ordenar';
    }

    protected function regras(): array
    {
        return [
            'instrucao' => ['nullable', 'string', 'max:200'],
            'modo' => ['nullable', 'string', 'in:sequencia,tempo,numeros'],
            'itens' => ['required', 'array', 'min:2', 'max:8'],
            'itens.*.texto' => ['required', 'string', 'max:120'],
            'itens.*.icone' => ['nullable', 'string', 'max:40'],
            'dica' => ['nullable', 'string', 'max:200'],
        ];
    }

    protected function normalizar(array $config): array
    {
        return [
            'instrucao' => $config['instrucao'] ?? null,
            'modo' => $config['modo'] ?? 'sequencia',
            'itens' => array_values(array_map(fn ($i) => ['texto' => trim($i['texto']), 'icone' => $i['icone'] ?? null], $config['itens'])),
            'dica' => $config['dica'] ?? null,
        ];
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        $config = $this->normalizar($atividade->configArray());
        $itens = $this->comIds($config['itens']);

        return [
            // `instrucao` da atividade é o que o alto-falante fala; `pergunta` é o enunciado do config.
            'pergunta' => $config['instrucao'],
            'modo' => $config['modo'],
            'itens' => Embaralhador::embaralharDiferente($itens, $contexto->semente),
        ];
    }

    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade
    {
        $config = $this->normalizar($config);
        $itens = $this->comIds($config['itens']);
        $certa = array_column($itens, 'id');
        $dada = array_values(array_map('strval', (array) ($resposta['ordem'] ?? [])));
        $revisao = [[
            'chave' => sprintf('ordenar:%d:%d', $contexto->aula->id, crc32(implode('|', array_column($itens, 'texto')))),
            'disciplina' => (string) $contexto->aula->disciplina,
            'dados' => ['tipo' => self::tipo(), 'config' => $config],
        ]];

        if ($dada === $certa) {
            return ResultadoAtividade::acerto(Mensagens::acerto($contexto->semente), (int) config('teia.xp.atividade_item', 1), 'unico', $revisao);
        }

        return ResultadoAtividade::erro(
            Mensagens::ERRO,
            $config['dica'] ?: 'pense no que acontece primeiro e no que vem depois.',
            ['ordem' => $certa, 'itens' => $itens],
            'unico',
            $revisao,
        );
    }

    /**
     * @param  list<array{texto: string, icone: string|null}>  $itens
     * @return list<array{id: string, texto: string, icone: string|null}>
     */
    private function comIds(array $itens): array
    {
        return array_map(fn ($item, $i) => [
            'id' => Embaralhador::id('ordenar', (string) $i, $item['texto']),
            'texto' => $item['texto'],
            'icone' => $item['icone'],
        ], $itens, array_keys($itens));
    }
}
