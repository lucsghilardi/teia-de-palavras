<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DuplaTentativa extends Model
{
    protected $table = 'dupla_tentativas';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['silabas' => 'array', 'respondida_em' => 'datetime'];
    }

    public function dupla(): BelongsTo
    {
        return $this->belongsTo(Dupla::class, 'dupla_id');
    }
}
