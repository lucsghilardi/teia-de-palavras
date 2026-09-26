<?php

namespace App\Models;

use App\Enums\Disciplina;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Uma missão de uma disciplina: uma sequência de atividades (aula_atividades).
 * Em Português ela também tem palavra geradora, história, conversa, sílabas,
 * famílias e dicionário, que as atividades legadas leem.
 *
 * O progresso da criança (crianca_aulas.etapa_atual) vai de 1 até N+1, em que
 * N é o número de atividades e N+1 é a tela de conquista.
 */
class Aula extends Model
{
    use HasFactory;

    public const STATUS_RASCUNHO = 'rascunho';

    public const STATUS_PUBLICADA = 'publicada';

    protected $table = 'aulas';

    protected $guarded = [];

    public function scopePublicadas(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLICADA);
    }

    /** Ordem do mapa: disciplina (na ordem dos planetas), fase, ordem, id. */
    public function scopeOrdenadas(Builder $query): Builder
    {
        $casos = [];
        $bindings = [];

        foreach (Disciplina::ordenadas() as $posicao => $disciplina) {
            $casos[] = 'WHEN ? THEN '.$posicao;
            $bindings[] = $disciplina->value;
        }

        return $query
            ->orderByRaw('CASE disciplina '.implode(' ', $casos).' ELSE 99 END', $bindings)
            ->orderBy('fase')
            ->orderBy('ordem')
            ->orderBy('id');
    }

    public function scopeDaDisciplina(Builder $query, Disciplina|string $disciplina): Builder
    {
        return $query->where('disciplina', $disciplina instanceof Disciplina ? $disciplina->value : $disciplina);
    }

    public function estaPublicada(): bool
    {
        return $this->status === self::STATUS_PUBLICADA;
    }

    public function disciplinaEnum(): Disciplina
    {
        return Disciplina::tryFrom((string) $this->disciplina) ?? Disciplina::padrao();
    }

    /** O que o nó do mapa mostra: rótulo, senão a palavra geradora, senão o título. */
    public function rotuloExibido(): string
    {
        return (string) ($this->rotulo ?: ($this->palavra_geradora ?: $this->titulo));
    }

    /** N: número de atividades (a tela de conquista é a etapa N+1). */
    public function totalAtividades(): int
    {
        if ($this->relationLoaded('atividades')) {
            return $this->atividades->count();
        }

        if (isset($this->attributes['atividades_count'])) {
            return (int) $this->attributes['atividades_count'];
        }

        return $this->atividades()->count();
    }

    public function atividades(): HasMany
    {
        return $this->hasMany(AulaAtividade::class, 'aula_id')->orderBy('ordem');
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
