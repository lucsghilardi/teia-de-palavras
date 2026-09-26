<?php

namespace App\Services\Atividades\Legado;

use App\Models\AulaAtividade;
use App\Services\Atividades\ContextoAtividade;

/** Ficha de descoberta: uma linha por sílaba com a família dela. */
final class Ficha extends Base
{
    public static function tipo(): string
    {
        return 'ficha';
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        return ['linhas' => $contexto->recurso('ficha', [])];
    }
}
