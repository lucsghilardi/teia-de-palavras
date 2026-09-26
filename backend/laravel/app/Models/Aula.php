<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Uma missão: palavra geradora, história, conversa, sílabas, famílias e dicionário. */
class Aula extends Model
{
    use HasFactory;

    public const STATUS_RASCUNHO = 'rascunho';

    public const STATUS_PUBLICADA = 'publicada';

    /** As 8 etapas sequenciais de toda aula (ver MotorEtapas). */
    public const ETAPAS = [
        1 => 'missao',
        2 => 'conversa',
        3 => 'palavra',
        4 => 'palmas',
        5 => 'ficha',
        6 => 'criacao',
        7 => 'producao',
        8 => 'conquista',
    ];

    protected $table = 'aulas';

    protected $guarded = [];

    public function scopePublicadas(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLICADA);
    }

    public function scopeOrdenadas(Builder $query): Builder
    {
        return $query->orderBy('fase')->orderBy('ordem')->orderBy('id');
    }

    public function estaPublicada(): bool
    {
        return $this->status === self::STATUS_PUBLICADA;
    }

    public function preRequisito(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'pre_requisito_aula_id');
    }

    public function dependentes(): HasMany
    {
        return $this->hasMany(Aula::class, 'pre_requisito_aula_id');
    }

    public function criadaPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'criada_por_user_id');
    }

    public function historiaPaginas(): HasMany
    {
        return $this->hasMany(AulaHistoriaPagina::class, 'aula_id')->orderBy('ordem');
    }

    public function perguntas(): HasMany
    {
        return $this->hasMany(AulaPergunta::class, 'aula_id')->orderBy('ordem');
    }

    public function silabas(): HasMany
    {
        return $this->hasMany(AulaSilaba::class, 'aula_id')->orderBy('ordem');
    }

    public function familias(): HasMany
    {
        return $this->hasMany(AulaFamilia::class, 'aula_id')->orderBy('ordem');
    }

    public function palavras(): HasMany
    {
        return $this->hasMany(AulaPalavra::class, 'aula_id')->orderBy('id');
    }

    public function progressos(): HasMany
    {
        return $this->hasMany(CriancaAula::class, 'aula_id');
    }
}
