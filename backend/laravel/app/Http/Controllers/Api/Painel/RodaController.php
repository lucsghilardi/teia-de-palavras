<?php

namespace App\Http\Controllers\Api\Painel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Roda\AbrirRodaRequest;
use App\Http\Requests\Roda\ComandoRodaRequest;
use App\Http\Requests\Roda\DuplasRequest;
use App\Models\Aula;
use App\Models\Dupla;
use App\Models\Turma;
use App\Models\TurmaSessao;
use App\Models\User;
use App\Services\Roda\RodaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** A Roda pelo educador: abrir, conduzir (comandos), montar duplas, encerrar. */
class RodaController extends Controller
{
    public function __construct(private readonly RodaService $rodas) {}

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $turmas = $user->ehAdmin() ? null : Turma::where('educador_user_id', $user->id)->pluck('id');
        $base = TurmaSessao::query()->when($turmas !== null, fn ($q) => $q->whereIn('turma_id', $turmas));

        $abertas = (clone $base)->abertas()->latest('id')->get();
        $encerradas = (clone $base)->where('status', TurmaSessao::ENCERRADA)->latest('encerrada_em')->limit(10)->get();

        return response()->json($abertas->concat($encerradas)->map(fn (TurmaSessao $r) => $this->rodas->estado($r))->values());
    }

    public function store(AbrirRodaRequest $request): JsonResponse
    {
        $turma = Turma::findOrFail($request->validated('turma_id'));
        $this->authorize('update', $turma);

        if ($aberta = $this->rodas->abertaDaTurma((int) $turma->id)) {
            return response()->json(['message' => 'Essa turma já tem uma roda aberta.', 'roda_id' => $aberta->id], 422);
        }

        $roda = $this->rodas->abrir($turma, Aula::findOrFail($request->validated('aula_id')), $request->user());

        return response()->json($this->rodas->estado($roda), 201);
    }

    public function show(Request $request, TurmaSessao $roda): JsonResponse
    {
        $this->autorizar($request->user(), $roda);

        return response()->json($this->rodas->pacotePainel($roda));
    }

    public function comandos(ComandoRodaRequest $request, TurmaSessao $roda): JsonResponse
    {
        $this->autorizar($request->user(), $roda);
        $valor = $request->validated('valor');

        return response()->json($this->rodas->estado($this->rodas->comandar($roda, $request->validated('acao'), $valor === null ? null : (int) $valor)));
    }

    public function duplas(DuplasRequest $request, TurmaSessao $roda): JsonResponse
    {
        $this->autorizar($request->user(), $roda);
        $duplas = $this->rodas->duplas($roda, $request->pares());

        return response()->json([
            'roda' => $this->rodas->estado($roda->refresh()),
            'duplas' => $duplas->map(fn (Dupla $d) => $this->rodas->estadoDupla($d))->values(),
        ]);
    }

    private function autorizar(User $user, TurmaSessao $roda): void
    {
        $roda->loadMissing('turma');
        $this->authorize('update', $roda->turma);
    }
}
