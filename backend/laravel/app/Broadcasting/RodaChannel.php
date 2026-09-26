<?php

namespace App\Broadcasting;

use App\Http\Resources\OpcaoVisualResource;
use App\Models\Crianca;
use App\Models\TurmaSessao;
use App\Models\User;
use App\Services\Amizades\AmizadeService;

/**
 * Canal de presença `roda.{id}`: entra o educador da turma (ou admin) e as
 * crianças da turma e das turmas amigas. O array devolvido é o que os outros
 * membros veem (de uma criança: só apelido e avatar).
 */
class RodaChannel
{
    public function __construct(private readonly AmizadeService $amizades) {}

    /** @return array<string, mixed>|false */
    public function join(User|Crianca $usuario, int $rodaId): array|false
    {
        $roda = TurmaSessao::with('turma:id,educador_user_id')->find($rodaId);

        if ($roda === null || $roda->status === TurmaSessao::ENCERRADA) {
            return false;
        }

        if ($usuario instanceof User) {
            $podeConduzir = $usuario->is_active
                && ($usuario->ehAdmin() || (int) $roda->turma->educador_user_id === (int) $usuario->id);

            return $podeConduzir
                ? ['id' => $usuario->getAuthIdentifierForBroadcasting(), 'tipo' => 'educador', 'nome' => $usuario->name]
                : false;
        }

        if (! $this->amizades->saoAmigas((int) $usuario->turma_id, (int) $roda->turma_id)) {
            return false;
        }

        $usuario->loadMissing('avatar');

        return [
            'id' => $usuario->getAuthIdentifierForBroadcasting(),
            'tipo' => 'crianca',
            'crianca_id' => $usuario->id,
            'apelido' => $usuario->apelido,
            'avatar' => $usuario->avatar ? (new OpcaoVisualResource($usuario->avatar))->resolve() : null,
        ];
    }
}
