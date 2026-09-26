<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

/**
 * Adulto do painel: administrador ou educador/responsável.
 * A criança NÃO é um User — ver App\Models\Crianca (guard `crianca`).
 */
class User extends Authenticatable implements JWTSubject
{
    use HasFactory;
    use Notifiable;

    public const PAPEL_ADMIN = 'admin';

    public const PAPEL_EDUCADOR = 'educador';

    public const PAPEIS = [self::PAPEL_ADMIN, self::PAPEL_EDUCADOR];

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function ehAdmin(): bool
    {
        return $this->role === self::PAPEL_ADMIN;
    }

    /**
     * Id no canal de presença do Reverb. Adulto e criança vêm de tabelas
     * diferentes: sem prefixo, o educador 1 e a criança 1 seriam o mesmo membro.
     */
    public function getAuthIdentifierForBroadcasting(): string
    {
        return 'e'.$this->getKey();
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }
}
