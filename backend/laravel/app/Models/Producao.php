<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Producao extends Model
{
    protected $table = 'producoes';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['palavras' => 'array'];
    }

    public function crianca(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'crianca_id');
    }

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'aula_id');
    }

    public function gravacao(): BelongsTo
    {
        return $this->belongsTo(Gravacao::class, 'gravacao_id');
    }
}
