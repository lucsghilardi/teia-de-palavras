<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Uso acumulado de uma sílaba pela criança; dominada após 3 palavras distintas. */
class CriancaSilaba extends Model
{
    public const PALAVRAS_PARA_DOMINAR = 3;

    protected $table = 'crianca_silabas';

    protected $guarded = [];

    public $incrementing = false;

    protected $primaryKey = null;

    protected function casts(): array
    {
        return ['primeira_vez_em' => 'datetime', 'dominada_em' => 'datetime'];
    }

    public function silaba(): BelongsTo
    {
        return $this->belongsTo(Silaba::class, 'silaba_id');
    }
}
