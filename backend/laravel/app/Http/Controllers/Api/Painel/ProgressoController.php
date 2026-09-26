<?php

namespace App\Http\Controllers\Api\Painel;

use App\Http\Controllers\Controller;
use App\Models\Crianca;
use App\Services\Painel\ProgressoService;
use Illuminate\Http\JsonResponse;

/** Progresso de uma criança (só o caminho dela; nunca comparação). */
class ProgressoController extends Controller
{
    public function __invoke(Crianca $crianca, ProgressoService $progresso): JsonResponse
    {
        $this->authorize('view', $crianca);

        return response()->json($progresso->para($crianca));
    }
}
