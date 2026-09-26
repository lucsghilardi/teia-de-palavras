<?php

namespace App\Services\Atividades\Legado;

use App\Models\AulaAtividade;
use App\Services\Atividades\ContextoAtividade;

/** A palavra geradora, grande, com figura e voz. */
final class Palavra extends Base
{
    public static function tipo(): string
    {
        return 'palavra';
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        return [
            'palavra' => (string) $contexto->aula->palavra_geradora,
            'imagem_url' => $contexto->recurso('palavra_imagem_url'),
            'audio_url' => $contexto->recurso('palavra_audio_url'),
        ];
    }
}
