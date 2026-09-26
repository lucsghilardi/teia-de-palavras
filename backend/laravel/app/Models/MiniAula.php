<?php

namespace App\Models;

use App\Services\Atividades\AvaliadorAtividade;
use App\Services\Atividades\RegistroAtividades;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Mini-aula: um desafio (atividade de um item, gerado por modelo a partir de
 * uma missão) mais um áudio gravado pela criança autora. Só circula depois
 * que um adulto aprova.
 */
class MiniAula extends Model
{
    public const PENDENTE = 'pendente';

    public const APROVADA = 'aprovada';

    public const RECUSADA = 'recusada';

    protected $table = 'mini_aulas';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'revisada_em' => 'datetime',
            'xp_autora' => 'integer',
        ];
    }

    public function autor(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'autor_crianca_id');
    }

    public function aulaOrigem(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'aula_origem_id');
    }

    public function gravacao(): BelongsTo
    {
        return $this->belongsTo(Gravacao::class, 'gravacao_id');
    }

    public function entregas(): HasMany
    {
        return $this->hasMany(MiniAulaEntrega::class, 'mini_aula_id');
    }

    public function revisadaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revisada_por_user_id');
    }

    public function scopeAprovadas(Builder $query): Builder
    {
        return $query->where('status', self::APROVADA);
    }

    public function estaAprovada(): bool
    {
        return $this->status === self::APROVADA;
    }

    /** @return array<string, mixed> */
    public function configArray(): array
    {
        return is_array($this->config) ? $this->config : [];
    }

    public function avaliador(): AvaliadorAtividade
    {
        return RegistroAtividades::para($this->tipo);
    }
}
