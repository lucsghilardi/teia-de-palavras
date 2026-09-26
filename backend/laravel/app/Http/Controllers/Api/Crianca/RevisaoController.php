<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Http\Requests\Crianca\ResponderAtividadeRequest;
use App\Models\Crianca;
use App\Models\CriancaItem;
use App\Services\Revisao\RevisaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** A "Revisão" do dia: itens vencidos remontados como atividades de um item. */
class RevisaoController extends Controller
{
    public function __construct(private readonly RevisaoService $revisao) {}

    public function index(Request $request): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');
        $itens = $this->revisao->itensDaSessao($crianca);

        return response()->json([
            'devidos' => $this->revisao->devidos($crianca),
            'itens' => $itens->values()->map(fn (CriancaItem $item, int $i) => [
                'id' => $item->id,
                'disciplina' => $item->disciplina,
                'chave' => $item->chave,
                'caixa' => (int) $item->caixa,
                'atividade' => $this->revisao->montar($crianca, $item, $i + 1),
            ]),
        ]);
    }

    public function responder(ResponderAtividadeRequest $request, CriancaItem $item): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');

        if ((int) $item->crianca_id !== (int) $crianca->id) {
            return response()->json(['message' => 'Esse item não é seu.'], 404);
        }

        return response()->json($this->revisao->responder($crianca, $item, $request->resposta()));
    }
}
