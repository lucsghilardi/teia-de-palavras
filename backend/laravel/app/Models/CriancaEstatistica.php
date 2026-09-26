<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CriancaEstatistica extends Model
{
    protected $table = 'crianca_estatisticas';

    protected $primaryKey = 'crianca_id';

    public $incrementing = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['ultimo_dia_ativo' => 'date'];
    }

    public function crianca(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'crianca_id');
    }
}
