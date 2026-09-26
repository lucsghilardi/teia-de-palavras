<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Http\Requests\Crianca\ResponderAtividadeRequest;
use App\Models\Aula;
use App\Models\Crianca;
use App\Services\Atividades\RespostaService;
use App\Services\Aulas\DesbloqueioService;
use Illuminate\Http\JsonResponse;

/**
 * Resposta a uma atividade da missão (POST /aulas/{aula}/atividades/{ordem}/responder).
 * O avaliador do tipo decide se acertou; o RespostaService aplica a política
 * de tentativas, o XP e os eventos.
 */
class AtividadeController extends Controller
{
    private const TRANCADA = 'Essa missão ainda está trancada. Termine a anterior!';

    public function __construct(
        private readonly DesbloqueioService $desbloqueio,
        private readonly RespostaService $respostas,
    ) {}

    public function responder(ResponderAtividadeRequest $request, Aula $aula, int $ordem): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');

        if ($this->desbloqueio->progressoOuIniciar($crianca, $aula) === null) {
            return response()->json(['message' => self::TRANCADA], 403);
        }

        $atividade = $aula->atividades()->where('ordem', $ordem)->first();

        if ($atividade === null) {
            return response()->json(['message' => 'Essa atividade não existe.'], 404);
        }

        if (! $atividade->ehAvaliada()) {
            return response()->json(['message' => 'Essa atividade não recebe resposta.'], 422);
        }

        return response()->json($this->respostas->responder($crianca, $aula, $atividade, $request->resposta()));
    }
}
