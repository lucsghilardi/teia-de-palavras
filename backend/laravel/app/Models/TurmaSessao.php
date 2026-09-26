<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Sessão síncrona do modo turma (círculo de cultura). */
class TurmaSessao extends Model
{
    public const AGUARDANDO = 'aguardando';

    public const EM_ANDAMENTO = 'em_andamento';

    public const ENCERRADA = 'encerrada';

    protected $table = 'turma_sessoes';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['estado' => 'array', 'iniciada_em' => 'datetime', 'encerrada_em' => 'datetime'];
    }

    public function turma(): BelongsTo
    {
        return $this->belongsTo(Turma::class, 'turma_id');
    }

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'aula_id');
    }

    public function educador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'educador_user_id');
    }

    public function criancaMestre(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'crianca_mestre_id');
    }

    public function participantes(): BelongsToMany
    {
        return $this->belongsToMany(Crianca::class, 'turma_sessao_participantes', 'turma_sessao_id', 'crianca_id')
            ->withPivot(['entrou_em', 'saiu_em', 'ultima_presenca_em']);
    }

    public function duplas(): HasMany
    {
        return $this->hasMany(Dupla::class, 'turma_sessao_id');
    }
}
