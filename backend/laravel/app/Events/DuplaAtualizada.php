<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Snapshot de uma dupla (DuplaEstado). Vai pelo canal da Roda: o educador vê
 * todas as duplas e cada criança filtra a sua.
 */
class DuplaAtualizada implements ShouldBroadcastNow
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
        return 'dupla.atualizada';
    }

    /** @return array<string, mixed> */
    public function broadcastWith(): array
    {
        return $this->estado;
    }
}
