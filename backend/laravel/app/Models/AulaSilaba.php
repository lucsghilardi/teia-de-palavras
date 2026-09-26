<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Sílaba da palavra geradora (uma "palma"), com a família que ela libera. */
class AulaSilaba extends Model
{
    protected $table = 'aula_silabas';

    protected $guarded = [];

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'aula_id');
    }

    public function silaba(): BelongsTo
    {
        return $this->belongsTo(Silaba::class, 'silaba_id');
    }

    public function familia(): HasMany
    {
        return $this->hasMany(AulaFamilia::class, 'aula_silaba_id')->orderBy('ordem');
    }
}
