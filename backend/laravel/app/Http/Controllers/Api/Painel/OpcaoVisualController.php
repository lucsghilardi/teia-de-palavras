<?php

namespace App\Http\Controllers\Api\Painel;

use App\Http\Controllers\Controller;
use App\Http\Resources\OpcaoVisualResource;
use App\Models\OpcaoVisual;
use Illuminate\Http\JsonResponse;

class OpcaoVisualController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'avatares' => OpcaoVisualResource::collection(OpcaoVisual::avatares()->ativas()->get()),
            'figuras' => OpcaoVisualResource::collection(OpcaoVisual::figuras()->ativas()->get()),
        ]);
    }
}
