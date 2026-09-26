<?php

namespace App\Http\Controllers\Api\Painel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Painel\AceitarAmizadeRequest;
use App\Models\Configuracao;
use App\Models\Turma;
use App\Models\TurmaAmizade;
use App\Models\User;
use App\Services\Amizades\AmizadeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Amizades entre turmas: gerar convite (código), aceitar com termo, encerrar. */
class AmizadeController extends Controller
{
    public function __construct(private readonly AmizadeService $amizades) {}

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $minhas = $user->ehAdmin() ? null : Turma::where('educador_user_id', $user->id)->pluck('id')->all();

        return response()->json([
            'termo' => ['versao' => Configuracao::valor('amizade_termo_versao'), 'texto' => Configuracao::valor('amizade_termo_texto')],
            'amizades' => $this->amizades->visiveisPara($user)->map(fn (TurmaAmizade $a) => $this->resumo($a, $minhas))->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $dados = $request->validate(['turma_id' => ['required', 'integer', 'exists:turmas,id']]);
        $turma = Turma::findOrFail($dados['turma_id']);
        $this->authorize('update', $turma);

        $amizade = $this->amizades->gerar($turma, $request->user());

        return response()->json($this->resumo($amizade->load(['turmaA', 'turmaB']), [$turma->id]), 201);
    }

    public function aceitar(AceitarAmizadeRequest $request): JsonResponse
    {
        $turma = Turma::findOrFail($request->validated('turma_id'));
        $this->authorize('update', $turma);

        $amizade = $this->amizades->aceitar($turma, $request->validated('codigo'), $request->user(), $request->boolean('termo_aceito'));

        return response()->json($this->resumo($amizade->load(['turmaA', 'turmaB']), [$turma->id]));
    }

    public function destroy(Request $request, TurmaAmizade $amizade): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $amizade->load(['turmaA', 'turmaB']);
        $minhas = $user->ehAdmin() ? [$amizade->turma_a_id, $amizade->turma_b_id] : Turma::where('educador_user_id', $user->id)->pluck('id')->all();

        abort_unless(in_array((int) $amizade->turma_a_id, array_map('intval', $minhas), true) || in_array((int) $amizade->turma_b_id, array_map('intval', $minhas), true), 403);

        return response()->json($this->resumo($this->amizades->encerrar($amizade)->load(['turmaA', 'turmaB']), $minhas));
    }

    /**
     * @param  list<int>|null  $minhasTurmas  null = admin (vê pelos dois lados)
     * @return array<string, mixed>
     */
    private function resumo(TurmaAmizade $a, ?array $minhasTurmas): array
    {
        $minhas = $minhasTurmas === null ? null : array_map('intval', $minhasTurmas);
        $ladoA = $minhas === null || in_array((int) $a->turma_a_id, $minhas, true);
        $minha = $ladoA ? $a->turmaA : $a->turmaB;
        $outra = $ladoA ? $a->turmaB : $a->turmaA;

        return [
            'id' => $a->id,
            'status' => $a->estaPendente() || $a->status !== TurmaAmizade::PENDENTE ? $a->status : 'vencida',
            // O código só aparece para quem gerou, e só enquanto vale.
            'codigo' => $ladoA && $a->estaPendente() ? $a->codigo : null,
            'turma' => $minha ? ['id' => $minha->id, 'nome' => $minha->nome] : null,
            'turma_amiga' => $outra ? ['id' => $outra->id, 'nome' => $outra->nome] : null,
            'gerada_por_mim' => $ladoA,
            'termo_versao' => $a->termo_versao,
            'expira_em' => $a->expira_em?->toIso8601String(),
            'aceita_em' => $a->aceita_em?->toIso8601String(),
            'encerrada_em' => $a->encerrada_em?->toIso8601String(),
            'created_at' => $a->created_at?->toIso8601String(),
        ];
    }
}
