<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Palavra conquistada pela criança (mural pessoal que só cresce). */
class TeiaPalavra extends Model
{
    protected $table = 'teia_palavras';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['silabas' => 'array', 'descoberta_em' => 'datetime'];
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
