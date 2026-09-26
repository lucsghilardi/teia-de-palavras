<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Http\Requests\Crianca\CriarMiniAulaRequest;
use App\Http\Requests\Crianca\ResponderAtividadeRequest;
use App\Models\Aula;
use App\Models\Crianca;
use App\Models\MiniAula;
use App\Models\MiniAulaEntrega;
use App\Services\Aulas\DesbloqueioService;
use App\Services\MiniAulas\MiniAulaService;
use App\Services\MiniAulas\ModelosMiniAula;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Base dos amigos: dar uma mini-aula (modelos + áudio) e jogar as recebidas. */
class MiniAulaController extends Controller
{
    public function __construct(
        private readonly MiniAulaService $miniAulas,
        private readonly ModelosMiniAula $modelos,
    ) {}

    /** Até 3 modelos de desafio a partir de uma missão aberta para a criança; `semente` sorteia outros. */
    public function modelos(Request $request, DesbloqueioService $desbloqueio): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');
        $dados = $request->validate(['aula_id' => ['required', 'integer'], 'semente' => ['nullable', 'integer', 'min:0', 'max:100000']]);
        $aula = Aula::with(['atividades', 'palavras'])->find($dados['aula_id']);

        abort_if($aula === null || ! $desbloqueio->podeIniciar($crianca, $aula), 404, 'Essa missão ainda está trancada.');

        $semente = (int) ($dados['semente'] ?? 0);

        return response()->json([
            'aula' => ['id' => $aula->id, 'titulo' => $aula->titulo, 'rotulo' => $aula->rotuloExibido(), 'disciplina' => $aula->disciplina],
            'semente' => $semente,
            'modelos' => array_map(fn ($m) => ['chave' => $m['chave'], 'tipo' => $m['tipo'], 'titulo' => $m['titulo'], 'fala' => $m['fala']], $this->modelos->para($crianca, $aula, $semente)),
            'limite_segundos' => (int) config('teia.mini_aulas.duracao_max_s', 60),
        ]);
    }

    public function store(CriarMiniAulaRequest $request, DesbloqueioService $desbloqueio): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');
        $aula = Aula::with(['atividades', 'palavras'])->findOrFail($request->validated('aula_id'));

        abort_unless($desbloqueio->podeIniciar($crianca, $aula), 403, 'Essa missão ainda está trancada.');

        $mini = $this->miniAulas->criar(
            $crianca,
            $aula,
            $request->validated('modelo'),
            (int) ($request->validated('semente') ?? 0),
            $request->file('audio'),
            $request->validated('duracao_ms') !== null ? (int) $request->validated('duracao_ms') : null,
        );

        return response()->json([
            'id' => $mini->id,
            'status' => $mini->status,
            'titulo' => $mini->titulo,
            'mensagem' => 'Sua aula foi para um adulto olhar. Quando for aprovada, ela chega aos seus amigos.',
        ], 201);
    }

    public function minhas(Request $request): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');

        return response()->json([
            'mini_aulas' => $this->miniAulas->minhas($crianca)->map(fn (MiniAula $m) => [
                'id' => $m->id,
                'titulo' => $m->titulo,
                'disciplina' => $m->disciplina,
                'tipo' => $m->tipo,
                'status' => $m->status,
                'respondidas' => (int) $m->respondidas,
                'reacoes' => $m->entregas->pluck('reacao')->filter()->countBy()->all(),
                'created_at' => $m->created_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    public function recebidas(Request $request): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');

        return response()->json([
            'novas' => $this->miniAulas->novas($crianca),
            'entregas' => $this->miniAulas->recebidas($crianca)->map(fn (MiniAulaEntrega $e) => $this->miniAulas->resumoEntrega($e))->values(),
        ]);
    }

    public function show(Request $request, MiniAulaEntrega $entrega): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');
        $this->minha($crianca, $entrega);

        return response()->json([
            ...$this->miniAulas->resumoEntrega($entrega),
            'atividade' => $this->miniAulas->montar($crianca, $entrega),
        ]);
    }

    public function responder(ResponderAtividadeRequest $request, MiniAulaEntrega $entrega): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');
        $this->minha($crianca, $entrega);

        return response()->json($this->miniAulas->responder($crianca, $entrega, $request->resposta()));
    }

    public function reagir(Request $request, MiniAulaEntrega $entrega): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca');
        $this->minha($crianca, $entrega);
        $dados = $request->validate(['reacao' => ['required', Rule::in(MiniAulaEntrega::REACOES)]]);

        return response()->json($this->miniAulas->resumoEntrega($this->miniAulas->reagir($entrega, $dados['reacao'])->load('miniAula.autor.avatar')));
    }

    private function minha(Crianca $crianca, MiniAulaEntrega $entrega): void
    {
        $entrega->loadMissing(['miniAula.autor.avatar', 'miniAula.gravacao']);

        abort_unless((int) $entrega->crianca_id === (int) $crianca->id && $entrega->miniAula?->estaAprovada() && $entrega->miniAula->autor !== null, 404);
    }
}
