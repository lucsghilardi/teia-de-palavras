<?php

namespace App\Services\Atividades\Legado;

use App\Models\AulaAtividade;
use App\Services\Atividades\ContextoAtividade;

/** Perguntas abertas para conversar com quem está perto (sem resposta certa). */
final class Conversa extends Base
{
    public static function tipo(): string
    {
        return 'conversa';
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        return ['perguntas' => $contexto->recurso('perguntas', [])];
    }
}
