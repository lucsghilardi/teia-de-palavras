<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Snapshot completo da Roda (docs/api-roda.md, RodaEstado). Os clientes
 * substituem o estado local; ao reconectar, buscam o snapshot pela API.
 * `Now`: sem fila no meio, para a tela da turma andar junto com o educador.
 */
class RodaAtualizada implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    /** @param array<string, mixed> $estado */
    public function __construct(public readonly int $rodaId, public readonly array $estado) {}

    public function broadcastOn(): PresenceChannel
    {
        return new PresenceChannel("roda.{$this->rodaId}");
    }

    public function broadcastAs(): string
    {
        return 'roda.atualizada';
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return $this->estado;
    }
}
