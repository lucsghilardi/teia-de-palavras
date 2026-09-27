<?php

use App\Models\Crianca;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

it('registra o limitador geral da API por conta', function () {
    $limitador = RateLimiter::limiter('api');

    expect($limitador)->not->toBeNull('O throttleApi() do bootstrap/app.php depende deste limitador.');

    $user = User::factory()->create();
    $requisicao = Request::create('/api/me');
    $requisicao->setUserResolver(fn () => $user);

    $limite = $limitador($requisicao);

    expect($limite->maxAttempts)->toBe(180)
        ->and($limite->key)->toBe((string) $user->id);
});

it('registra o limitador de entrada da criança por criança e IP', function () {
    $limitador = RateLimiter::limiter('crianca-login');

    expect($limitador)->not->toBeNull();

    $requisicao = Request::create('/api/crianca/login', 'POST', ['crianca_id' => 7]);
    $limite = $limitador($requisicao);

    expect($limite->maxAttempts)->toBe(5)
        ->and($limite->key)->toContain('7|');
});

it('registra o limitador da voz neural por criança quando há token, senão por IP', function () {
    $limitador = RateLimiter::limiter('voz');

    expect($limitador)->not->toBeNull();

    $anonima = Request::create('/api/crianca/voz');
    $limite = $limitador($anonima);

    expect($limite->maxAttempts)->toBe(120)
        ->and($limite->key)->toBe('voz:'.$anonima->ip());

    $crianca = Crianca::factory()->create();
    $logada = Request::create('/api/crianca/voz');
    $logada->setUserResolver(fn () => $crianca);

    expect($limitador($logada)->key)->toBe('voz:'.$crianca->id);
});

it('registra o limitador folgado dos arquivos de voz por IP', function () {
    $limitador = RateLimiter::limiter('vozes');

    expect($limitador)->not->toBeNull();

    $requisicao = Request::create('/api/vozes/abc.mp3');
    $limite = $limitador($requisicao);

    expect($limite->maxAttempts)->toBe(600)
        ->and($limite->key)->toBe('vozes:'.$requisicao->ip());
});
