<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Entrega um arquivo do disco privado (áudio gravado por criança, imagem
 * enviada pelo educador) declarando o tipo pela EXTENSÃO GRAVADA, nunca pelo
 * conteúdo.
 *
 * A `Storage::response()` crua resolve o Content-Type com o finfo, que olha os
 * primeiros bytes: um "foto.jpg" com HTML dentro voltaria como text/html e o
 * navegador executaria o script na origem do painel. O que não estiver na
 * lista fechada abaixo desce como anexo opaco.
 */
class ArquivoPrivado
{
    /** Extensão gravada → Content-Type devolvido (e exibível/tocável no navegador). */
    private const TIPOS = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'pdf' => 'application/pdf',
        'webm' => 'audio/webm',
        'ogg' => 'audio/ogg',
        'mp3' => 'audio/mpeg',
        'm4a' => 'audio/mp4',
        'mp4' => 'audio/mp4',
        'wav' => 'audio/wav',
    ];

    public static function resposta(string $disco, string $path): StreamedResponse
    {
        $tipo = self::TIPOS[strtolower(pathinfo($path, PATHINFO_EXTENSION))] ?? null;

        return Storage::disk($disco)->response(
            $path,
            null,
            [
                'Content-Type' => $tipo ?? 'application/octet-stream',
                'X-Content-Type-Options' => 'nosniff',
                // Mesmo cinto que o Laravel põe na rota /storage assinada. Sem
                // script nem carregamento externo mesmo para SVG.
                'Content-Security-Policy' => "default-src 'none'; style-src 'unsafe-inline'; sandbox",
            ],
            $tipo !== null ? 'inline' : 'attachment',
        );
    }
}
