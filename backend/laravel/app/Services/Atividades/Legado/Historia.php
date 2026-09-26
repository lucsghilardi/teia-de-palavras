<?php

namespace App\Services\Atividades\Legado;

use App\Models\AulaAtividade;
use App\Models\Configuracao;
use App\Services\Atividades\ContextoAtividade;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * A história em páginas (texto, imagem, áudio). Em Português vem de
 * aula_historia_paginas (config vazio); nas outras disciplinas as páginas
 * ficam no config: { paginas: [ { texto, icone? } ] }.
 */
final class Historia extends Base
{
    public static function tipo(): string
    {
        return 'historia';
    }

    public function validarConfig(array $config): array
    {
        if (! isset($config['paginas'])) {
            return [];
        }

        $validador = Validator::make($config, [
            'paginas' => ['required', 'array', 'min:1', 'max:20'],
            'paginas.*.texto' => ['required', 'string', 'max:600'],
            'paginas.*.icone' => ['nullable', 'string', 'max:40'],
        ]);

        if ($validador->fails()) {
            throw new ValidationException($validador);
        }

        return ['paginas' => array_values(array_map(fn ($p) => ['texto' => trim($p['texto']), 'icone' => $p['icone'] ?? null], $config['paginas']))];
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        $paginas = $atividade->configArray()['paginas'] ?? null;

        if (is_array($paginas) && $paginas !== []) {
            return ['paginas' => array_map(fn ($p) => [
                'texto' => Configuracao::aplicarPlaceholders((string) $p['texto']),
                'icone' => $p['icone'] ?? null,
                'imagem_url' => null,
                'audio_url' => null,
            ], array_values($paginas))];
        }

        return ['paginas' => $contexto->recurso('historia', [])];
    }
}
