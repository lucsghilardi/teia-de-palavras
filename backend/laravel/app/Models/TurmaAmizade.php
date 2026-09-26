<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Amizade entre duas turmas (casas): o responsável A gera um código, o
 * responsável B aceita com o termo. Só com a amizade aceita as mini-aulas
 * (áudio de criança) circulam entre as duas turmas.
 */
class TurmaAmizade extends Model
{
    public const PENDENTE = 'pendente';

    public const ACEITA = 'aceita';

    public const ENCERRADA = 'encerrada';

    protected $table = 'turma_amizades';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'expira_em' => 'datetime',
            'aceita_em' => 'datetime',
            'encerrada_em' => 'datetime',
        ];
    }

    public function turmaA(): BelongsTo
    {
        return $this->belongsTo(Turma::class, 'turma_a_id');
    }

    public function turmaB(): BelongsTo
    {
        return $this->belongsTo(Turma::class, 'turma_b_id');
    }

    public function scopeAceitas(Builder $query): Builder
    {
        return $query->where('status', self::ACEITA);
    }

    /** Amizades em que a turma participa (de um lado ou do outro). */
    public function scopeDaTurma(Builder $query, int $turmaId): Builder
    {
        return $query->where(fn (Builder $q) => $q->where('turma_a_id', $turmaId)->orWhere('turma_b_id', $turmaId));
    }

    public function estaPendente(): bool
    {
        return $this->status === self::PENDENTE && $this->expira_em->isFuture();
    }

    public function estaAceita(): bool
    {
        return $this->status === self::ACEITA;
    }

    /** A outra turma, do ponto de vista de $turmaId (null enquanto pendente). */
    public function outraTurmaId(int $turmaId): ?int
    {
        if ((int) $this->turma_a_id === $turmaId) {
            return $this->turma_b_id === null ? null : (int) $this->turma_b_id;
        }

        return (int) $this->turma_a_id;
    }

    public static function gerarCodigo(): string
    {
        $alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

        do {
            $codigo = '';

            for ($i = 0; $i < 8; $i++) {
                $codigo .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
            }
        } while (static::where('codigo', $codigo)->exists());

        return $codigo;
    }
}
