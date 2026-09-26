<?php

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
