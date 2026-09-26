<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/** Catálogo global de sílabas (texto único, com acento quando houver). */
class Silaba extends Model
{
    use HasFactory;

    protected $table = 'silabas';

    protected $guarded = [];

    public static function obterOuCriar(string $texto): self
    {
        $texto = mb_strtoupper(trim($texto), 'UTF-8');

        return static::firstOrCreate(['texto' => $texto]);
    }
}
