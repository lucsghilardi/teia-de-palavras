<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evento extends Model
{
    protected $table = 'eventos';

    protected $guarded = [];

    public $timestamps = false;

    protected function casts(): array
    {
        return ['dados' => 'array', 'ocorrido_em' => 'datetime'];
    }

    public function sessao(): BelongsTo
    {
        return $this->belongsTo(Sessao::class, 'sessao_id');
    }
}
