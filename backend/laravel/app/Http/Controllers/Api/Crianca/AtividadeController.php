<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Http\Requests\Crianca\ResponderAtividadeRequest;
use App\Models\Aula;
use App\Models\Crianca;
use App\Services\Atividades\ContextoAtividade;
use App\Services\Audio\ResolverAudio;
use App\Services\Aulas\DesbloqueioService;
use App\Services\Crianca\GamificacaoCrianca;
use Illuminate\Http\JsonResponse;

/**
 * Resposta a uma atividade da missão (POST /aulas/{aula}/atividades/{ordem}/responder).
 * O avaliador do tipo decide se acertou; a resposta traz mensagem, dica e,
 * nos tipos legados de Português, a tentativa completa em `extra`.
 */
class AtividadeController extends Controller
{
    private const TRANCADA = 'Essa missão ainda está trancada. Termine a anterior!';

    public function __construct(
        private readonly DesbloqueioService $desbloqueio,
        private readonly GamificacaoCrianca $gamificacao,
    ) {}

    public function responder(ResponderAtividadeRequest $request, Aula $aula, int $ordem): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');
        $linha = $this->desbloqueio->progressoOuIniciar($crianca, $aula);

        if ($linha === null) {
            return response()->json(['message' => self::TRANCADA], 403);
        }

        $atividade = $aula->atividades()->where('ordem', $ordem)->first();

        if ($atividade === null) {
            return response()->json(['message' => 'Essa atividade não existe.'], 404);
        }

        if (! $atividade->ehAvaliada()) {
            return response()->json(['message' => 'Essa atividade não recebe resposta.'], 422);
        }

        $contexto = new ContextoAtividade(
            $crianca,
            $aula,
            ResolverAudio::para($crianca),
            [],
            ContextoAtividade::semente($crianca, $aula, $ordem),
        );

        $resultado = $atividade->avaliador()->avaliar($atividade->configArray(), $request->resposta(), $contexto);
        $stats = $this->gamificacao->estatisticas($crianca);

        return response()->json([
            ...$resultado->toArray(),
            'xp_total' => (int) $stats->xp_total,
            'nivel' => (int) $stats->nivel,
        ]);
    }
}
