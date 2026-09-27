<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Http\Requests\Crianca\BuscarVozRequest;
use App\Services\Voz\VozService;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * URL do áudio neural de um texto: 200 { url } quando existe ou pôde ser gerado;
 * 204 quando não há voz (provedor desligado, orçamento, falha), e o app fala
 * com a voz do navegador. Pública: as telas de entrada falam antes do login.
 */
class VozController extends Controller
{
    public function __invoke(BuscarVozRequest $request, VozService $vozes): Response
    {
        $texto = (string) $request->validated('texto');
        $url = $vozes->existente($texto);

        if ($url === null && $vozes->ativa() && $this->podeGerarNova($request)) {
            $url = $vozes->gerar($texto);
        }

        return $url === null ? response()->noContent() : response()->json(['url' => $url]);
    }

    /**
     * Teto diário de frases NOVAS por criança (ou IP antes do login). Só conta
     * quando vai gerar: repetir frases já em cache é de graça.
     */
    private function podeGerarNova(BuscarVozRequest $request): bool
    {
        $chave = 'voz-novas:'.($request->user('crianca')?->getAuthIdentifier() ?? $request->ip());
        $teto = (int) config('teia.voz.novas_por_dia', 500);

        if (RateLimiter::tooManyAttempts($chave, $teto)) {
            return false;
        }

        RateLimiter::hit($chave, 86400);

        return true;
    }
}
