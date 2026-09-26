<?php

namespace App\Services\Atividades\Legado;

use App\Models\AulaAtividade;
use App\Models\Configuracao;
use App\Services\Atividades\ContextoAtividade;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * Perguntas abertas para conversar com quem está perto (sem resposta certa).
 * Em Português vêm de aula_perguntas; nas outras disciplinas, do config:
 * { perguntas: ["…"] }.
 */
final class Conversa extends Base
{
    public static function tipo(): string
    {
        return 'conversa';
    }

    public function validarConfig(array $config): array
    {
        if (! isset($config['perguntas'])) {
            return [];
        }

        $validador = Validator::make($config, [
            'perguntas' => ['required', 'array', 'min:1', 'max:10'],
            'perguntas.*' => ['required', 'string', 'max:300'],
        ]);

        if ($validador->fails()) {
            throw new ValidationException($validador);
        }

        return ['perguntas' => array_values(array_map('trim', $config['perguntas']))];
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        $perguntas = $atividade->configArray()['perguntas'] ?? null;

        if (is_array($perguntas) && $perguntas !== []) {
            return ['perguntas' => array_map(fn ($p) => ['texto' => Configuracao::aplicarPlaceholders((string) $p), 'audio_url' => null], array_values($perguntas))];
        }

        return ['perguntas' => $contexto->recurso('perguntas', [])];
    }
}
