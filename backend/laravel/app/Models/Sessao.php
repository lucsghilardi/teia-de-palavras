<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Sessão de uso da criança (tempo por sessão, pausa sugerida). */
class Sessao extends Model
{
    protected $table = 'sessoes';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'iniciada_em' => 'datetime',
            'ultima_atividade_em' => 'datetime',
            'encerrada_em' => 'datetime',
        ];
    }

    public function crianca(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'crianca_id');
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(Evento::class, 'sessao_id');
    }

    public function turmaSessao(): BelongsTo
    {
        return $this->belongsTo(TurmaSessao::class, 'turma_sessao_id');
    }
}
