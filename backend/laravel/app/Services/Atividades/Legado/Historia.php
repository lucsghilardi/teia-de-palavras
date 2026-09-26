<?php

namespace App\Services\Atividades\Legado;

use App\Models\AulaAtividade;
use App\Services\Atividades\ContextoAtividade;

/** A história em páginas (texto, imagem, áudio), lida de aula_historia_paginas. */
final class Historia extends Base
{
    public static function tipo(): string
    {
        return 'historia';
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        return ['paginas' => $contexto->recurso('historia', [])];
    }
}
