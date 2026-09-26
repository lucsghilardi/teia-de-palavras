<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/** Avatares e figuras secretas (placeholders em emoji até a ilustração final). */
class OpcaoVisual extends Model
{
    public const TIPO_AVATAR = 'avatar';

    public const TIPO_FIGURA = 'figura_secreta';

    protected $table = 'opcoes_visuais';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['ativa' => 'boolean'];
    }

    public function scopeAtivas(Builder $query): Builder
    {
        return $query->where('ativa', true)->orderBy('ordem');
    }

    public function scopeAvatares(Builder $query): Builder
    {
        return $query->where('tipo', self::TIPO_AVATAR);
    }

    public function scopeFiguras(Builder $query): Builder
    {
        return $query->where('tipo', self::TIPO_FIGURA);
    }
}
