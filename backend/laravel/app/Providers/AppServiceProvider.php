<?php

namespace App\Providers;

use App\Services\Voz\GoogleSintetizador;
use App\Services\Voz\Sintetizador;
use App\Services\Voz\SintetizadorNulo;
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
        // Provedor da voz neural escolhido pela config. `bind` (não singleton):
        // lê a config na hora de resolver, então os testes trocam de provedor
        // com config([...]) antes de bater na rota.
        $this->app->bind(Sintetizador::class, function () {
            $voz = (array) config('teia.voz');

            return match ($voz['provedor'] ?? 'nulo') {
                'google' => new GoogleSintetizador(
                    (string) ($voz['chave'] ?? ''),
                    (string) ($voz['nome'] ?? ''),
                    (float) ($voz['velocidade'] ?? 1.0),
                ),
                default => new SintetizadorNulo,
            };
        });
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

        // Mini-aulas gravadas: cinto contra abuso (conta toda tentativa, até as
        // inválidas); o teto real de mini-aulas criadas por dia fica no serviço.
        RateLimiter::for('mini-aulas', fn (Request $request) => Limit::perDay((int) config('teia.mini_aulas.por_dia', 10) * 5)
            ->by('mini-aulas:'.($request->user('crianca')?->getAuthIdentifier() ?? $request->ip()))
            ->response(fn () => response()->json(['message' => 'Você já gravou muitas aulas hoje. Amanhã tem mais!'], 429)));

        // Busca da turma pelo código (pública): trava adivinhação de códigos.
        RateLimiter::for('crianca-turma', fn (Request $request) => Limit::perMinute(30)
            ->by($request->ip())
            ->response(fn () => self::esperarUmPouquinho()));

        // Voz neural: por criança quando o Bearer vem (o proxy injeta mesmo em
        // rota pública), senão por IP (telas de entrada). Um 429 aqui só faz
        // o app falar com a voz do navegador.
        RateLimiter::for('voz', fn (Request $request) => Limit::perMinute(120)
            ->by('voz:'.($request->user('crianca')?->getAuthIdentifier() ?? $request->ip())));

        // Arquivos .mp3 da voz: sem Bearer e com cache de um ano no navegador.
        // A escola inteira sai por um IP só, por isso é folgado e substitui o
        // throttle geral da API nessa rota.
        RateLimiter::for('vozes', fn (Request $request) => Limit::perMinute(600)->by('vozes:'.$request->ip()));
    }

    /** 429 do app da criança em pt-BR e gentil (o padrão do Laravel é "Too Many Attempts."). */
    private static function esperarUmPouquinho(): JsonResponse
    {
        return response()->json(['message' => 'Vamos esperar um pouquinho? Depois a gente tenta de novo.'], 429);
    }
}
