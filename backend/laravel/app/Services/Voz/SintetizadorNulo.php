<?php

namespace App\Services\Voz;

/** Sem provedor configurado (dev, testes, CI): nunca gera nada. */
final class SintetizadorNulo implements Sintetizador
{
    public function nome(): string
    {
        return 'nulo';
    }

    public function ativo(): bool
    {
        return false;
    }

    public function sintetizar(string $texto): string
    {
        throw new SinteseFalhou('Voz neural desativada.');
    }
}
