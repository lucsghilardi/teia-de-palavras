<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Services\Voz\VozService;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Serve um MP3 da voz neural. O nome é o hash do conteúdo, então o navegador
 * pode guardar por um ano. BinaryFileResponse trata `Range` (Safari/iPad só
 * toca mídia com 206). Público e sem Bearer: o <audio> carrega direto do APP_URL.
 */
class VozArquivoController extends Controller
{
    public function __invoke(string $hash): BinaryFileResponse
    {
        $caminho = VozService::caminho($hash);
        $disco = Storage::disk(VozService::DISCO);

        abort_unless($disco->exists($caminho), 404);

        return response()->file($disco->path($caminho), [
            'Content-Type' => 'audio/mpeg',
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
            'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        ]);
    }
}
