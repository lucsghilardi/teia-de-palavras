<?php

use App\Http\Middleware\EnsureActivePanelUser;
use App\Http\Middleware\EnsureCriancaAtiva;
use App\Http\Middleware\EnsureRole;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // Autorização dos canais do Reverb sob o prefixo /api, aceitando os DOIS
    // guards JWT: o educador (api) e a criança (crianca). Assim a rota
    // /api/broadcasting/auth passa pelo proxy do Next, que injeta o Bearer do
    // cookie httpOnly. O default (/broadcasting/auth no grupo web, com sessão)
    // não serve porque o front não usa cookie de sessão do Laravel.
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['prefix' => 'api', 'middleware' => ['auth:api,crianca']],
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(fn () => null);

        // Sem isto o grupo `api` não tem throttle nenhum. O limitador `api`
        // (180/min por conta) está no AppServiceProvider.
        $middleware->throttleApi();

        // O painel e o app falam com a API pelo proxy do Next; sem confiar no
        // X-Forwarded-For todo request chega com o IP do container do Next e o
        // throttle do login perde a dimensão de origem. Só faixas privadas do
        // compose. HOST fica fora de propósito.
        $middleware->trustProxies(
            at: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', '127.0.0.1'],
            headers: Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_PROTO,
        );

        $middleware->alias([
            'auth' => Authenticate::class,
            'panel.active' => EnsureActivePanelUser::class,
            'role' => EnsureRole::class,
            'crianca.ativa' => EnsureCriancaAtiva::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // A API não tem páginas: qualquer erro em api/* sai como JSON, mesmo
        // sem header Accept.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();
