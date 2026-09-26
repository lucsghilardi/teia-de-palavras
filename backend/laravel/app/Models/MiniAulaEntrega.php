<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Uma mini-aula entregue a uma criança: recebida → respondida (com reação opcional). */
class MiniAulaEntrega extends Model
{
    public const RECEBIDA = 'recebida';

    public const RESPONDIDA = 'respondida';

    public const REACOES = ['valeu', 'aprendi', 'top'];

    protected $table = 'mini_aula_entregas';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'resposta' => 'array',
            'correta' => 'boolean',
            'tentativas' => 'integer',
            'respondida_em' => 'datetime',
        ];
    }

    public function miniAula(): BelongsTo
    {
        return $this->belongsTo(MiniAula::class, 'mini_aula_id');
    }

    public function crianca(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'crianca_id');
    }
}
