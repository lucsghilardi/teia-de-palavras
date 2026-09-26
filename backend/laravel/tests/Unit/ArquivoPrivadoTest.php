<?php

use App\Support\ArquivoPrivado;
use Illuminate\Support\Facades\Storage;

/*
| O tipo do arquivo servido vem da EXTENSÃO GRAVADA, nunca do conteúdo: um
| "foto.jpg" com HTML dentro não pode voltar como text/html.
*/

beforeEach(function () {
    Storage::fake('local');
});

it('serve imagem com o tipo da extensão mesmo com HTML dentro', function () {
    Storage::disk('local')->put('gravacoes/1/foto.jpg', '<html><script>alert(1)</script></html>');

    $resposta = ArquivoPrivado::resposta('local', 'gravacoes/1/foto.jpg');

    expect($resposta->headers->get('Content-Type'))->toBe('image/jpeg')
        ->and($resposta->headers->get('X-Content-Type-Options'))->toBe('nosniff')
        ->and($resposta->headers->get('Content-Disposition'))->toStartWith('inline');
});

it('serve áudio gravado (webm) inline', function () {
    Storage::disk('local')->put('gravacoes/1/palavra.webm', 'binario');

    $resposta = ArquivoPrivado::resposta('local', 'gravacoes/1/palavra.webm');

    expect($resposta->headers->get('Content-Type'))->toBe('audio/webm')
        ->and($resposta->headers->get('Content-Disposition'))->toStartWith('inline');
});

it('manda extensão desconhecida como anexo opaco', function () {
    Storage::disk('local')->put('gravacoes/1/lista.csv', "a;b\n1;2");

    $resposta = ArquivoPrivado::resposta('local', 'gravacoes/1/lista.csv');

    expect($resposta->headers->get('Content-Type'))->toBe('application/octet-stream')
        ->and($resposta->headers->get('Content-Disposition'))->toStartWith('attachment');
});
