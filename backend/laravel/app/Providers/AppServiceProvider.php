<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Respostas da API sem o envelope {"data": ...} (contrato em docs/api-painel.md).
        JsonResource::withoutWrapping();

        $this->configurarLimites();
    }

    /**
     * Tetos de requisição da API. O `api` é aplicado ao grupo inteiro pelo
     * `throttleApi()` do bootstrap/app.php.
     */
    private function configurarLimites(): void
    {
        RateLimiter::for('api', function (Request $request) {
            // Por conta quando autenticado (adulto ou criança): uma pessoa não
            // derruba a outra. 180/min cobre folgado a tela mais pesada.
            $chave = $request->user('api')?->getAuthIdentifier()
                ?? ($request->user('crianca')?->getAuthIdentifier() ? 'crianca:'.$request->user('crianca')->getAuthIdentifier() : null)
                ?? $request->ip();

            return Limit::perMinute(180)->by((string) $chave);
        });

        // Entrada da criança (avatar + figura secreta): a figura é 1 entre poucas,
        // então o que protege é o teto por criança+IP, não a entropia.
        RateLimiter::for('crianca-login', fn (Request $request) => Limit::perMinute(5)
            ->by(sprintf('%s|%s', $request->input('crianca_id', '-'), $request->ip()))
            ->response(fn () => self::esperarUmPouquinho()));

        // Busca da turma pelo código (pública): trava adivinhação de códigos.
        RateLimiter::for('crianca-turma', fn (Request $request) => Limit::perMinute(30)
            ->by($request->ip())
            ->response(fn () => self::esperarUmPouquinho()));
    }

    /** 429 do app da criança em pt-BR e gentil (o padrão do Laravel é "Too Many Attempts."). */
    private static function esperarUmPouquinho(): JsonResponse
    {
        return response()->json(['message' => 'Vamos esperar um pouquinho? Depois a gente tenta de novo.'], 429);
    }
}
