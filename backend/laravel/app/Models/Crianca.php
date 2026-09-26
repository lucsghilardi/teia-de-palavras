<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Contracts\JWTSubject;

/**
 * Criança que usa o app. Autentica pelo guard `crianca` (JWT próprio) com
 * avatar + figura secreta, sem e-mail nem senha. Dados mínimos (LGPD):
 * apelido, avatar e turma.
 */
class Crianca extends Authenticatable implements JWTSubject
{
    use HasFactory;
    use SoftDeletes;

    protected $table = 'criancas';

    protected $fillable = [
        'turma_id',
        'responsavel_user_id',
        'apelido',
        'avatar_chave',
        'figura_secreta_hash',
        'usa_minusculas',
        'tentativas_login_falhas',
        'bloqueada_ate',
        'exclusao_solicitada_em',
    ];

    protected $hidden = [
        'figura_secreta_hash',
    ];

    protected function casts(): array
    {
        return [
            'usa_minusculas' => 'boolean',
            'bloqueada_ate' => 'datetime',
            'exclusao_solicitada_em' => 'datetime',
        ];
    }

    public function turma(): BelongsTo
    {
        return $this->belongsTo(Turma::class, 'turma_id');
    }

    public function responsavel(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsavel_user_id');
    }

    public function consentimentos(): HasMany
    {
        return $this->hasMany(Consentimento::class, 'crianca_id');
    }

    public function consentimentoVigente(): HasOne
    {
        return $this->hasOne(Consentimento::class, 'crianca_id')->whereNull('revogado_em')->latestOfMany('aceito_em');
    }

    public function avatar(): BelongsTo
    {
        return $this->belongsTo(OpcaoVisual::class, 'avatar_chave', 'chave');
    }

    public function progressoAulas(): HasMany
    {
        return $this->hasMany(CriancaAula::class, 'crianca_id');
    }

    public function aulas(): BelongsToMany
    {
        return $this->belongsToMany(Aula::class, 'crianca_aulas', 'crianca_id', 'aula_id')
            ->withPivot(['status', 'etapa_atual', 'iniciada_em', 'concluida_em'])
            ->withTimestamps();
    }

    public function teia(): HasMany
    {
        return $this->hasMany(TeiaPalavra::class, 'crianca_id');
    }

    public function silabas(): HasMany
    {
        return $this->hasMany(CriancaSilaba::class, 'crianca_id');
    }

    public function sessoes(): HasMany
    {
        return $this->hasMany(Sessao::class, 'crianca_id');
    }

    public function gravacoes(): HasMany
    {
        return $this->hasMany(Gravacao::class, 'crianca_id');
    }

    public function estatisticas(): HasOne
    {
        return $this->hasOne(CriancaEstatistica::class, 'crianca_id');
    }

    public function conquistas(): HasMany
    {
        return $this->hasMany(CriancaConquista::class, 'crianca_id');
    }

    public function definirFiguraSecreta(string $chave): void
    {
        $this->figura_secreta_hash = Hash::make($chave);
        $this->tentativas_login_falhas = 0;
        $this->bloqueada_ate = null;
    }

    public function conferirFiguraSecreta(string $chave): bool
    {
        return Hash::check($chave, $this->figura_secreta_hash);
    }

    public function estaBloqueada(): bool
    {
        return $this->bloqueada_ate !== null && $this->bloqueada_ate->isFuture();
    }

    /**
     * Id no canal de presença do Reverb. Adulto e criança vêm de tabelas
     * diferentes: sem prefixo, o educador 1 e a criança 1 seriam o mesmo membro.
     */
    public function getAuthIdentifierForBroadcasting(): string
    {
        return 'c'.$this->getKey();
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return ['tipo' => 'crianca'];
    }
}
