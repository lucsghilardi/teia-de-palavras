<?php

namespace App\Services\Atividades\Legado;

use App\Models\AulaAtividade;
use App\Services\Atividades\ContextoAtividade;

/** Separar a palavra geradora em sílabas batendo palmas. */
final class Palmas extends Base
{
    public static function tipo(): string
    {
        return 'palmas';
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        return ['silabas' => $contexto->recurso('palmas', [])];
    }
}
