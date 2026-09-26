<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Normalização de palavras e sílabas: caixa alta e sem diacríticos.
 * BONÉ e BONE viram BONE; a grafia exibida continua a do dicionário.
 */
final class Texto
{
    public static function normalizar(string $texto): string
    {
        $texto = mb_strtoupper(trim($texto), 'UTF-8');

        return Str::upper(Str::ascii($texto, 'pt'));
    }

    /** "BO-NE-CA" ou "BO NE CA" → ["BO","NE","CA"] (em caixa alta, com acento preservado). */
    public static function separarSilabas(string $texto): array
    {
        $partes = preg_split('/[\s\-\.\/|]+/u', trim($texto)) ?: [];

        return array_values(array_filter(array_map(
            fn (string $p) => mb_strtoupper(trim($p), 'UTF-8'),
            $partes,
        ), fn (string $p) => $p !== ''));
    }

    /** Junta sílabas numa palavra normalizada para comparação. */
    public static function juntarNormalizado(array $silabas): string
    {
        return self::normalizar(implode('', $silabas));
    }
}
