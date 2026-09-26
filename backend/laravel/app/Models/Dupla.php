<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dupla extends Model
{
    protected $table = 'duplas';

    protected $guarded = [];

    public function sessao(): BelongsTo
    {
        return $this->belongsTo(TurmaSessao::class, 'turma_sessao_id');
    }

    public function criancaA(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'crianca_a_id');
    }

    public function criancaB(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'crianca_b_id');
    }

    public function tentativas(): HasMany
    {
        return $this->hasMany(DuplaTentativa::class, 'dupla_id');
    }

    public function tem(int $criancaId): bool
    {
        return (int) $this->crianca_a_id === $criancaId || (int) $this->crianca_b_id === $criancaId;
    }

    /** O par de $criancaId. */
    public function outra(int $criancaId): int
    {
        return (int) $this->crianca_a_id === $criancaId ? (int) $this->crianca_b_id : (int) $this->crianca_a_id;
    }
}
