<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Membro de uma família silábica liberada por uma aula. */
class AulaFamilia extends Model
{
    protected $table = 'aula_familias';

    protected $guarded = [];

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'aula_id');
    }

    public function aulaSilaba(): BelongsTo
    {
        return $this->belongsTo(AulaSilaba::class, 'aula_silaba_id');
    }

    public function silaba(): BelongsTo
    {
        return $this->belongsTo(Silaba::class, 'silaba_id');
    }
}
