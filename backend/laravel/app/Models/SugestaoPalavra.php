<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SugestaoPalavra extends Model
{
    protected $table = 'sugestoes_palavras';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['revisada_em' => 'datetime'];
    }

    public function crianca(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'crianca_id');
    }

    public function gravacao(): BelongsTo
    {
        return $this->belongsTo(Gravacao::class, 'gravacao_id');
    }

    public function palavra(): BelongsTo
    {
        return $this->belongsTo(Palavra::class, 'palavra_id');
    }
}
