<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Resposta da criança a um item de atividade (tentativas, acerto, última resposta). */
class CriancaResposta extends Model
{
    protected $table = 'crianca_respostas';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'acertou' => 'boolean',
            'acertou_na_primeira' => 'boolean',
            'ultima_resposta' => 'array',
            'tentativas' => 'integer',
        ];
    }

    public function crianca(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'crianca_id');
    }

    public function atividade(): BelongsTo
    {
        return $this->belongsTo(AulaAtividade::class, 'aula_atividade_id');
    }
}
