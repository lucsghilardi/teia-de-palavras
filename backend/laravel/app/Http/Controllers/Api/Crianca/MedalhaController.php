<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Models\Crianca;
use App\Models\CriancaConquista;
use App\Services\Crianca\GamificacaoCrianca;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Todas as medalhas (ganhas e por ganhar) da criança. Só o próprio caminho: nunca compara crianças. */
class MedalhaController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');
        $ganhas = CriancaConquista::where('crianca_id', $crianca->id)->pluck('desbloqueada_em', 'chave');

        $medalhas = collect(config('conquistas'))->map(fn ($dados, $chave) => [
            ...GamificacaoCrianca::conquista($chave),
            'desbloqueada_em' => $ganhas->get($chave)?->toIso8601String(),
        ])->values();

        return response()->json([
            'total' => $medalhas->count(),
            'desbloqueadas' => $ganhas->count(),
            'medalhas' => $medalhas,
        ]);
    }
}
