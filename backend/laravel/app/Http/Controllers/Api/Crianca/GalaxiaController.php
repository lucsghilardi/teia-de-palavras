<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Services\Galaxia\GalaxiaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Início do app da criança: planetas, escolhas do dia, revisão e amigos. */
class GalaxiaController extends Controller
{
    public function __invoke(Request $request, GalaxiaService $galaxia): JsonResponse
    {
        return response()->json($galaxia->montar($request->user('crianca')));
    }
}
