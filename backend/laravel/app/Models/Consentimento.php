<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Consentimento extends Model
{
    protected $table = 'consentimentos';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['aceito_em' => 'datetime', 'revogado_em' => 'datetime'];
    }

    public function crianca(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'crianca_id');
    }

    public function responsavel(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
