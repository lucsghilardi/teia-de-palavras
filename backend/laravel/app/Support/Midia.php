<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/** Mídia pública das aulas (disco `public`). Áudios de crianças NÃO passam por aqui. */
final class Midia
{
    public const DISCO = 'public';

    public static function url(?string $path): ?string
    {
        return $path ? Storage::disk(self::DISCO)->url($path) : null;
    }

    public static function apagar(?string ...$paths): void
    {
        $existentes = array_values(array_filter($paths));

        if ($existentes !== []) {
            Storage::disk(self::DISCO)->delete($existentes);
        }
    }
}
