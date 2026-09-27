<?php

namespace App\Services\Voz;

/**
 * Quem transforma texto em áudio (MP3). Cada provedor (Google, e no futuro
 * Azure, OpenAI, ElevenLabs...) implementa isto; o VozService, os controllers
 * e o front não sabem qual está por trás.
 */
interface Sintetizador
{
    /** Nome curto que entra na chave do cache (ex.: "google"). */
    public function nome(): string;

    /** false sem chave/config: o app cai na voz do navegador sem chamar ninguém. */
    public function ativo(): bool;

    /**
     * Bytes de um MP3 com o texto falado.
     *
     * @throws SinteseFalhou em erro de rede ou da API
     */
    public function sintetizar(string $texto): string;
}
