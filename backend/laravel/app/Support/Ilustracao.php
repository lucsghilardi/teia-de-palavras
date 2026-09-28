<?php

namespace App\Support;

use Illuminate\Validation\ValidationException;

/**
 * Chave de uma cena desenhada pelo app da criança (registro em
 * frontend/components/crianca/ilustracoes/catalogo.ts). O backend só guarda e
 * repassa a chave; chave que o front não conhece cai no ícone de reserva.
 */
final class Ilustracao
{
    public const REGEX = '/^[a-z0-9]+(-[a-z0-9]+)*$/';

    public const MAX = 60;

    /** Regra de validação para FormRequest e Validator. */
    public static function regra(): array
    {
        return ['nullable', 'string', 'max:'.self::MAX, 'regex:'.self::REGEX];
    }

    /** Vazio vira null; chave malformada vira erro de validação no campo. */
    public static function normalizar(mixed $valor, string $campo): ?string
    {
        $chave = trim((string) ($valor ?? ''));

        if ($chave === '') {
            return null;
        }

        if (mb_strlen($chave) > self::MAX || preg_match(self::REGEX, $chave) !== 1) {
            throw ValidationException::withMessages([$campo => 'Ilustração inválida: use a chave de uma cena do app (letras minúsculas, números e hífens).']);
        }

        return $chave;
    }
}
