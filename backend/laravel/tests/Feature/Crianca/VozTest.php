<?php

use App\Models\Crianca;
use App\Services\Voz\VozService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/*
| GET /crianca/voz?texto= (público: as telas de entrada falam antes do login)
| e GET /vozes/{hash}.mp3 (o <audio> carrega direto do APP_URL).
*/

beforeEach(function () {
    Storage::fake('local');
    Http::fake(['texttospeech.googleapis.com/*' => Http::response(['audioContent' => base64_encode('MP3-FALSO')])]);
});

function ligarGoogle(): void
{
    config(['teia.voz.provedor' => 'google', 'teia.voz.chave' => 'chave-teste']);
}

it('responde 204 sem provedor configurado, com e sem token', function () {
    $this->get('/api/crianca/voz?texto=oi')->assertNoContent();
    $this->comoCrianca(Crianca::factory()->create())->get('/api/crianca/voz?texto=oi')->assertNoContent();
    Http::assertNothingSent();
});

it('devolve a URL do MP3 gerado, sem token e como criança', function () {
    ligarGoogle();
    $hash = app(VozService::class)->chave('oi, vamos brincar?');
    $url = rtrim(config('app.url'), '/')."/api/vozes/{$hash}.mp3";

    $this->get('/api/crianca/voz?texto='.rawurlencode('Oi, vamos brincar?'))->assertOk()->assertExactJson(['url' => $url]);
    $this->comoCrianca(Crianca::factory()->create())->get('/api/crianca/voz?texto='.rawurlencode('oi, vamos  brincar?'))
        ->assertOk()->assertJson(['url' => $url]);
    Http::assertSentCount(1);
});

it('valida o texto: obrigatório e até o máximo de caracteres', function () {
    ligarGoogle();

    $this->getJson('/api/crianca/voz')->assertUnprocessable()->assertJsonValidationErrors('texto');
    $this->getJson('/api/crianca/voz?texto='.str_repeat('a', 301))->assertUnprocessable()->assertJsonValidationErrors('texto');
    Http::assertNothingSent();
});

it('serve o MP3 com cache de um ano, fora do throttle geral, e 404 para o que não existe', function () {
    ligarGoogle();
    $url = $this->get('/api/crianca/voz?texto=oi')->json('url');
    $hash = app(VozService::class)->chave('oi');

    $resposta = $this->get(parse_url($url, PHP_URL_PATH))
        ->assertOk()
        ->assertHeader('Content-Type', 'audio/mpeg')
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-RateLimit-Limit', '600');

    expect($resposta->headers->get('Cache-Control'))->toContain('max-age=31536000')->toContain('immutable')->toContain('public')
        ->and(file_get_contents($resposta->baseResponse->getFile()->getPathname()))->toBe('MP3-FALSO');

    $this->get('/api/vozes/'.str_repeat('0', 64).'.mp3')->assertNotFound();
    $this->get('/api/vozes/abc.mp3')->assertNotFound();
    $this->get("/api/vozes/{$hash}")->assertNotFound();
});

it('atende Range (Safari/iPad) com 206', function () {
    ligarGoogle();
    $url = $this->get('/api/crianca/voz?texto=oi')->json('url');

    $this->get(parse_url($url, PHP_URL_PATH), ['Range' => 'bytes=0-1'])
        ->assertStatus(206)
        ->assertHeader('Content-Range', 'bytes 0-1/9');
});

it('limita frases NOVAS por dia, mas repetir uma frase em cache continua de graça', function () {
    ligarGoogle();
    config(['teia.voz.novas_por_dia' => 1]);
    $crianca = Crianca::factory()->create();

    $this->comoCrianca($crianca)->get('/api/crianca/voz?texto=primeira')->assertOk();
    $this->comoCrianca($crianca)->get('/api/crianca/voz?texto=segunda')->assertNoContent();
    $this->comoCrianca($crianca)->get('/api/crianca/voz?texto=primeira')->assertOk();
    Http::assertSentCount(1);
});

it('sem login, limita os caracteres novos do dia somando todos os IPs; a criança logada segue gerando', function () {
    ligarGoogle();
    config(['teia.voz.anonimas_chars_por_dia' => 10]);

    $this->get('/api/crianca/voz?texto=primeira')->assertOk();
    $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])->get('/api/crianca/voz?texto=segunda')->assertNoContent();
    $this->get('/api/crianca/voz?texto=primeira')->assertOk();
    $this->comoCrianca(Crianca::factory()->create())->get('/api/crianca/voz?texto=segunda')->assertOk();
    Http::assertSentCount(2);
});
