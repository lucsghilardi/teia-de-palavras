<?php

namespace App\Models;

use App\Support\Texto;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Palavra do dicionário da aula. */
class AulaPalavra extends Model
{
    protected $table = 'aula_palavras';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['silabas' => 'array', 'destaque' => 'boolean'];
    }

    protected static function booted(): void
    {
        static::saving(function (self $palavra) {
            $palavra->palavra = mb_strtoupper(trim($palavra->palavra), 'UTF-8');
            $palavra->palavra_normalizada = Texto::normalizar($palavra->palavra);
        });
    }

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'aula_id');
    }
}
