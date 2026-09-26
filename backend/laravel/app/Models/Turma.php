<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Turma extends Model
{
    use HasFactory;

    protected $table = 'turmas';

    protected $guarded = [];

    protected function casts(): array
    {
        return ['ativa' => 'boolean'];
    }

    public function educador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'educador_user_id');
    }

    public function criancas(): HasMany
    {
        return $this->hasMany(Crianca::class, 'turma_id');
    }

    public function sessoes(): HasMany
    {
        return $this->hasMany(TurmaSessao::class, 'turma_id');
    }

    /** Código de 6 caracteres sem letras/dígitos ambíguos (0/O, 1/I/L). */
    public static function gerarCodigo(): string
    {
        $alfabeto = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

        do {
            $codigo = '';
            for ($i = 0; $i < 6; $i++) {
                $codigo .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
            }
        } while (static::where('codigo', $codigo)->exists());

        return $codigo;
    }

    public static function normalizarCodigo(string $codigo): string
    {
        return Str::upper(preg_replace('/[^A-Za-z0-9]/', '', $codigo) ?? '');
    }
}
