<?php

namespace App\Services\Voz;

use Illuminate\Support\Facades\Http;

/**
 * Google Cloud Text-to-Speech (REST, chave de API). Vozes pt-BR naturais:
 * Chirp 3 HD (ex.: pt-BR-Chirp3-HD-Leda) ou Neural2 (ex.: pt-BR-Neural2-A).
 * A chave vai em header, não em ?key=, para não parar em logs de acesso.
 */
final class GoogleSintetizador implements Sintetizador
{
    private const URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

    public function __construct(
        private readonly string $chave,
        private readonly string $voz,
        private readonly float $velocidade,
    ) {}

    public function nome(): string
    {
        return 'google';
    }

    public function ativo(): bool
    {
        return $this->chave !== '' && $this->voz !== '';
    }

    public function sintetizar(string $texto): string
    {
        $audio = ['audioEncoding' => 'MP3', 'speakingRate' => $this->velocidade];

        // Chirp 3 HD recusa `pitch` (e SSML); Neural2/WaveNet aceitam.
        if (! str_contains($this->voz, 'Chirp')) {
            $audio['pitch'] = 1.0;
        }

        $resposta = Http::withHeaders(['X-Goog-Api-Key' => $this->chave])
            ->timeout(10)
            ->retry(2, 250, throw: false)
            ->post(self::URL, [
                'input' => ['text' => $texto],
                'voice' => ['languageCode' => 'pt-BR', 'name' => $this->voz],
                'audioConfig' => $audio,
            ]);

        $conteudo = $resposta->json('audioContent');
        $bytes = is_string($conteudo) ? base64_decode($conteudo, true) : false;

        if ($resposta->failed() || $bytes === false || $bytes === '') {
            throw new SinteseFalhou(sprintf(
                'Google TTS: HTTP %d %s',
                $resposta->status(),
                mb_substr((string) $resposta->body(), 0, 200),
            ));
        }

        return $bytes;
    }
}
