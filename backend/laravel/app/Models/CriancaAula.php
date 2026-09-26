<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Progresso de uma criança numa aula. "Bloqueada" = ausência de linha. */
class CriancaAula extends Model
{
    public const DISPONIVEL = 'disponivel';

    public const EM_ANDAMENTO = 'em_andamento';

    public const CONCLUIDA = 'concluida';

    protected $table = 'crianca_aulas';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['iniciada_em' => 'datetime', 'concluida_em' => 'datetime'];
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
