<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/** Áudio gravado por uma criança (disco privado). */
class Gravacao extends Model
{
    use SoftDeletes;

    public const PENDENTE = 'pendente';

    public const APROVADA = 'aprovada';

    public const RECUSADA = 'recusada';

    protected $table = 'gravacoes';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['revisada_em' => 'datetime'];
    }

    public function scopeAprovadas(Builder $query): Builder
    {
        return $query->where('status', self::APROVADA);
    }

    public function crianca(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'crianca_id');
    }

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'aula_id');
    }
}
