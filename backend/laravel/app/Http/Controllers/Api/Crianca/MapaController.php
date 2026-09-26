<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Services\Aulas\DesbloqueioService;
use App\Support\Midia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MapaController extends Controller
{
    public function __invoke(Request $request, DesbloqueioService $desbloqueio): JsonResponse
    {
        $missoes = $desbloqueio->mapa($request->user('crianca'))->map(fn ($item) => [
            'id' => $item['aula']->id,
            'titulo' => $item['aula']->titulo,
            'fase' => $item['aula']->fase,
            'ordem' => $item['aula']->ordem,
            'palavra_geradora' => $item['aula']->palavra_geradora,
            'palavra_imagem_url' => Midia::url($item['aula']->palavra_imagem_path),
            'status' => $item['status'],
            'etapa_atual' => $item['etapa_atual'],
        ])->values();

        return response()->json(['missoes' => $missoes]);
    }
}
