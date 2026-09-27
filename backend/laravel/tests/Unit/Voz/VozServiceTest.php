<?php

use App\Services\Voz\VozService;
use GuzzleHttp\Promise\PromiseInterface;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/*
| Voz neural em cache: cada frase é sintetizada uma vez, guardada pelo hash do
| texto normalizado e nunca pedida de novo ao provedor.
*/

beforeEach(function () {
    Storage::fake('local');
    config(['teia.voz.provedor' => 'google', 'teia.voz.chave' => 'chave-teste', 'teia.voz.nome' => 'pt-BR-Chirp3-HD-Leda']);
});

/** O Google responde assim (o primeiro fake registrado vence, por isso cada teste chama o seu). */
function googleResponde(?PromiseInterface $resposta = null): void
{
    Http::fake(['texttospeech.googleapis.com/*' => $resposta ?? Http::response(['audioContent' => base64_encode('MP3-FALSO')])]);
}

it('normaliza o texto: trim, espaços colapsados e minúsculas com acento preservado', function () {
    expect(VozService::normalizar("  Toque   na\n RESPOSTA. "))->toBe('toque na resposta.')
        ->and(VozService::normalizar('ÁGUA É VIDA'))->toBe('água é vida');
});

it('gera o MP3 uma vez, grava pelo hash e devolve a URL absoluta de APP_URL', function () {
    googleResponde();
    $vozes = app(VozService::class);

    $url = $vozes->gerar('Toque na resposta certa.');
    $hash = $vozes->chave('toque na resposta certa.');

    expect($url)->toBe(rtrim(config('app.url'), '/')."/api/vozes/{$hash}.mp3");
    Storage::disk('local')->assertExists('vozes/'.substr($hash, 0, 2)."/{$hash}.mp3");
    expect(Storage::disk('local')->get(VozService::caminho($hash)))->toBe('MP3-FALSO');

    // Segunda vez (mesmo texto com outra caixa e espaços): nada de HTTP.
    expect($vozes->gerar('TOQUE NA  RESPOSTA CERTA.'))->toBe($url)
        ->and($vozes->existente('toque na resposta certa.'))->toBe($url);
    Http::assertSentCount(1);
});

it('manda a voz, a velocidade e a chave no header; Chirp sem pitch, Neural2 com pitch', function () {
    googleResponde();
    config(['teia.voz.velocidade' => 0.92]);
    app(VozService::class)->gerar('oi');

    Http::assertSent(fn (Request $r) => $r->hasHeader('X-Goog-Api-Key', 'chave-teste')
        && $r['input']['text'] === 'oi'
        && $r['voice']['languageCode'] === 'pt-BR'
        && $r['voice']['name'] === 'pt-BR-Chirp3-HD-Leda'
        && $r['audioConfig']['audioEncoding'] === 'MP3'
        && $r['audioConfig']['speakingRate'] === 0.92
        && ! isset($r['audioConfig']['pitch']));

    config(['teia.voz.nome' => 'pt-BR-Neural2-A']);
    app(VozService::class)->gerar('oi');

    Http::assertSent(fn (Request $r) => $r['voice']['name'] === 'pt-BR-Neural2-A' && isset($r['audioConfig']['pitch']));
    Http::assertSentCount(2);
});

it('muda a chave quando a voz muda, para trocar de voz sem purgar o cache', function () {
    $antes = app(VozService::class)->chave('oi');
    config(['teia.voz.nome' => 'pt-BR-Neural2-A']);

    expect(app(VozService::class)->chave('oi'))->not->toBe($antes);
});

it('não gera texto vazio nem acima do máximo de caracteres', function () {
    googleResponde();
    config(['teia.voz.max_chars' => 10]);
    $vozes = app(VozService::class);

    expect($vozes->gerar('   '))->toBeNull()
        ->and($vozes->existente(''))->toBeNull()
        ->and($vozes->gerar(str_repeat('a', 11)))->toBeNull()
        ->and($vozes->gerar(str_repeat('a', 10)))->not->toBeNull();
    Http::assertSentCount(1);
});

it('respeita o orçamento mensal de caracteres e só contabiliza no sucesso', function () {
    googleResponde();
    config(['teia.voz.limite_mensal_chars' => 10]);
    $vozes = app(VozService::class);

    expect($vozes->gerar('oi tudo'))->not->toBeNull()   // 7 chars
        ->and(VozService::usoDoMes())->toBe(7)
        ->and($vozes->gerar('bem?'))->toBeNull()        // 7 + 4 > 10
        ->and(VozService::usoDoMes())->toBe(7)
        ->and($vozes->gerar('ok!'))->not->toBeNull()    // 7 + 3 = 10
        ->and(VozService::usoDoMes())->toBe(10);
    Http::assertSentCount(2);
    expect(Cache::get('voz:chars:'.now()->format('Y-m')))->toBe(10);
});

it('devolve null sem exceção quando o provedor falha e não grava nada', function () {
    googleResponde(Http::response('erro', 500));

    expect(app(VozService::class)->gerar('oi'))->toBeNull()
        ->and(Storage::disk('local')->allFiles())->toBe([])
        ->and(VozService::usoDoMes())->toBe(0);
});

it('fica inativa com o provedor nulo e nunca chama ninguém', function () {
    googleResponde();
    config(['teia.voz.provedor' => 'nulo']);
    $vozes = app(VozService::class);

    expect($vozes->ativa())->toBeFalse()
        ->and($vozes->gerar('oi'))->toBeNull();
    Http::assertNothingSent();
});
