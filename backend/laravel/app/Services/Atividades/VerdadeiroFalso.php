<?php

namespace App\Services\Atividades;

/**
 * Verdadeiro ou falso: uma escolha de duas opções fixas.
 *
 * config: { itens: [ { id?, frase, correta: bool, dica?, explicacao?, icone? } ] }
 */
final class VerdadeiroFalso extends Escolha
{
    public const OPCOES = ['verdadeiro', 'falso'];

    public static function tipo(): string
    {
        return 'verdadeiro_falso';
    }

    protected function regras(): array
    {
        return [
            'itens' => ['required', 'array', 'min:1', 'max:12'],
            'itens.*.id' => ['nullable', 'string', 'max:40'],
            'itens.*.frase' => ['required', 'string', 'max:300'],
            'itens.*.correta' => ['required', 'boolean'],
            'itens.*.dica' => ['nullable', 'string', 'max:200'],
            'itens.*.explicacao' => ['nullable', 'string', 'max:300'],
            'itens.*.icone' => ['nullable', 'string', 'max:40'],
        ];
    }

    protected function normalizar(array $config): array
    {
        // Já veio no formato de escolha (ex.: item de revisão): mantém.
        if (isset($config['itens'][0]['opcoes'])) {
            return parent::normalizar($config);
        }

        $itens = [];

        foreach (array_values($config['itens']) as $i => $item) {
            $itens[] = [
                'id' => ($item['id'] ?? null) ?: 'v'.($i + 1),
                'pergunta' => trim($item['frase']),
                'opcoes' => self::OPCOES,
                'correta' => filter_var($item['correta'], FILTER_VALIDATE_BOOLEAN) ? 0 : 1,
                'dica' => $item['dica'] ?? null,
                'explicacao' => $item['explicacao'] ?? null,
                'icone' => $item['icone'] ?? null,
            ];
        }

        return ['itens' => $itens, 'embaralhar' => false];
    }
}
