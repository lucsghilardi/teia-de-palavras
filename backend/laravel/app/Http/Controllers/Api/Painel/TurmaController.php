<?php

namespace App\Http\Controllers\Api\Painel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Painel\TurmaRequest;
use App\Http\Resources\TurmaResource;
use App\Models\Crianca;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class TurmaController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $turmas = Turma::query()
            ->when(! $user->ehAdmin(), fn ($q) => $q->where('educador_user_id', $user->id))
            ->with('educador:id,name')
            ->withCount('criancas')
            ->orderByDesc('ativa')
            ->orderBy('nome')
            ->get();

        return TurmaResource::collection($turmas);
    }

    public function store(TurmaRequest $request): JsonResponse
    {
        $turma = Turma::create([
            'educador_user_id' => $request->user()->id,
            'nome' => $request->validated('nome'),
            'ativa' => $request->boolean('ativa', true),
            'codigo' => Turma::gerarCodigo(),
        ]);

        return (new TurmaResource($turma->load('educador:id,name')->loadCount('criancas')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Turma $turma): TurmaResource
    {
        $this->authorize('view', $turma);

        return new TurmaResource($turma->load(['educador:id,name', 'criancas' => fn ($q) => $q->orderBy('apelido'), 'criancas.avatar'])->loadCount('criancas'));
    }

    public function update(TurmaRequest $request, Turma $turma): TurmaResource
    {
        $this->authorize('update', $turma);

        $turma->update([
            'nome' => $request->validated('nome'),
            'ativa' => $request->boolean('ativa'),
        ]);

        return new TurmaResource($turma->load('educador:id,name')->loadCount('criancas'));
    }

    /** Gera outro código (ex.: o antigo vazou). Dispositivos já pareados precisam do novo. */
    public function novoCodigo(Turma $turma): TurmaResource
    {
        $this->authorize('update', $turma);

        $turma->update(['codigo' => Turma::gerarCodigo()]);

        return new TurmaResource($turma->load('educador:id,name')->loadCount('criancas'));
    }

    public function destroy(Turma $turma): Response
    {
        $this->authorize('delete', $turma);

        if (Crianca::withTrashed()->where('turma_id', $turma->id)->exists()) {
            throw ValidationException::withMessages(['turma' => 'A turma tem crianças cadastradas. Mova ou exclua as crianças antes.']);
        }

        $turma->delete();

        return response()->noContent();
    }
}
