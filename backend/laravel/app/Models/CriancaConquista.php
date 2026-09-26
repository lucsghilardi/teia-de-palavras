<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CriancaConquista extends Model
{
    protected $table = 'crianca_conquistas';

    protected $guarded = [];

    public $timestamps = false;

    protected function casts(): array
    {
        return ['desbloqueada_em' => 'datetime'];
    }
}
