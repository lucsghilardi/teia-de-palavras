<?php

namespace App\Http\Controllers\Api\Painel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Painel\CriancaRequest;
use App\Http\Requests\Painel\FiguraSecretaRequest;
use App\Http\Resources\CriancaResource;
use App\Models\Crianca;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/**
 * Cadastro de crianças pelo responsável/educador, sempre com consentimento
 * registrado. Dados mínimos: apelido, avatar, figura secreta e turma.
 */
class CriancaController extends Controller
{
    private const RELACOES = ['turma:id,nome,codigo,educador_user_id', 'responsavel:id,name', 'avatar', 'consentimentoVigente'];

    public function index(Request $request): AnonymousResourceCollection
    {
        /** @var User $user */
        $user = $request->user();

        $criancas = Crianca::query()
            ->when(! $user->ehAdmin(), fn ($q) => $q->whereHas('turma', fn ($t) => $t->where('educador_user_id', $user->id)))
            ->when($request->filled('turma_id'), fn ($q) => $q->where('turma_id', (int) $request->query('turma_id')))
            ->with(self::RELACOES)
            ->orderBy('apelido')
            ->get();

        return CriancaResource::collection($criancas);
    }

    public function store(CriancaRequest $request): JsonResponse
    {
        $turma = Turma::findOrFail($request->validated('turma_id'));
        $this->authorize('update', $turma);

        $crianca = DB::transaction(function () use ($request, $turma) {
            $crianca = new Crianca([
                'turma_id' => $turma->id,
                'responsavel_user_id' => $request->user()->id,
                'apelido' => $request->validated('apelido'),
                'avatar_chave' => $request->validated('avatar_chave'),
                'usa_minusculas' => $request->boolean('usa_minusculas'),
            ]);
            $crianca->definirFiguraSecreta($request->validated('figura_secreta_chave'));
            $crianca->save();

            $crianca->consentimentos()->create([
                'user_id' => $request->user()->id,
                'versao_texto' => $request->validated('consentimento.versao_texto'),
                'aceito_em' => now(),
                'ip' => $request->ip(),
            ]);

            return $crianca;
        });

        return (new CriancaResource($crianca->load(self::RELACOES)))->response()->setStatusCode(201);
    }

    public function show(Crianca $crianca): CriancaResource
    {
        $this->authorize('view', $crianca);

        return new CriancaResource($crianca->load(self::RELACOES));
    }

    public function update(CriancaRequest $request, Crianca $crianca): CriancaResource
    {
        $this->authorize('update', $crianca);

        $novaTurma = Turma::findOrFail($request->validated('turma_id'));
        $this->authorize('update', $novaTurma);

        $crianca->update([
            'turma_id' => $novaTurma->id,
            'apelido' => $request->validated('apelido'),
            'avatar_chave' => $request->validated('avatar_chave'),
            'usa_minusculas' => $request->boolean('usa_minusculas'),
        ]);

        return new CriancaResource($crianca->load(self::RELACOES));
    }

    /** Redefine a figura secreta e desbloqueia a entrada. */
    public function figuraSecreta(FiguraSecretaRequest $request, Crianca $crianca): CriancaResource
    {
        $this->authorize('update', $crianca);

        $crianca->definirFiguraSecreta($request->validated('figura_secreta_chave'));
        $crianca->save();

        return new CriancaResource($crianca->load(self::RELACOES));
    }

    /** LGPD: registra o pedido de exclusão feito pelo responsável. */
    public function solicitarExclusao(Crianca $crianca): CriancaResource
    {
        $this->authorize('update', $crianca);

        $crianca->update(['exclusao_solicitada_em' => $crianca->exclusao_solicitada_em ?? now()]);

        return new CriancaResource($crianca->load(self::RELACOES));
    }

    public function destroy(Crianca $crianca): Response
    {
        $this->authorize('delete', $crianca);

        $crianca->delete();

        return response()->noContent();
    }
}
