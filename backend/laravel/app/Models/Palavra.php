<?php

namespace App\Models;

use App\Support\Texto;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/** Dicionário geral de palavras permitidas. */
class Palavra extends Model
{
    use HasFactory;

    protected $table = 'palavras';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['silabas' => 'array', 'aprovada' => 'boolean', 'aprovada_em' => 'datetime'];
    }

    protected static function booted(): void
    {
        static::saving(function (self $palavra) {
            $palavra->palavra = mb_strtoupper(trim($palavra->palavra), 'UTF-8');
            $palavra->palavra_normalizada = Texto::normalizar($palavra->palavra);
        });
    }

    public function scopeAprovadas(Builder $query): Builder
    {
        return $query->where('aprovada', true);
    }
}
