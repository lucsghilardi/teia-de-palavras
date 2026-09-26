<?php

namespace App\Http\Controllers\Api\Painel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Painel\AtualizarAulaRequest;
use App\Http\Requests\Painel\MidiaAulaRequest;
use App\Http\Requests\Painel\NovaAulaRequest;
use App\Http\Resources\AulaResource;
use App\Http\Resources\AulaResumoResource;
use App\Models\Aula;
use App\Services\Aulas\AulaEditorService;
use App\Services\Aulas\AulaMidiaService;
use App\Services\Palavras\SugestorFamilia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/** CMS de aulas (missões). */
class AulaController extends Controller
{
    public function __construct(
        private readonly AulaEditorService $editor,
        private readonly AulaMidiaService $midia,
    ) {}

    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Aula::class);

        return AulaResumoResource::collection($this->listar());
    }

    public function store(NovaAulaRequest $request): JsonResponse
    {
        $this->authorize('create', Aula::class);

        $aula = $this->editor->criar($request->validated(), $request->user());

        return (new AulaResource($aula))->response()->setStatusCode(201);
    }

    public function show(Aula $aula): AulaResource
    {
        $this->authorize('view', $aula);

        return new AulaResource($aula->load(AulaEditorService::RELACOES));
    }

    public function update(AtualizarAulaRequest $request, Aula $aula): AulaResource
    {
        $this->authorize('update', $aula);

        return new AulaResource($this->editor->atualizar($aula, $request->validated(), $request->user()));
    }

    public function destroy(Aula $aula): Response
    {
        $this->authorize('delete', $aula);

        $this->editor->apagar($aula);

        return response()->noContent();
    }

    public function publicar(Aula $aula): AulaResource
    {
        $this->authorize('update', $aula);

        return new AulaResource($this->editor->publicar($aula));
    }

    public function despublicar(Aula $aula): AulaResource
    {
        $this->authorize('update', $aula);

        return new AulaResource($this->editor->despublicar($aula));
    }

    public function reordenar(Request $request): AnonymousResourceCollection
    {
        $this->authorize('create', Aula::class);

        $dados = $request->validate([
            'ordem' => ['required', 'array', 'min:1'],
            'ordem.*' => ['integer', 'distinct'],
        ]);

        $this->editor->reordenar(array_map('intval', $dados['ordem']));

        return AulaResumoResource::collection($this->listar());
    }

    public function enviarMidia(MidiaAulaRequest $request, Aula $aula): JsonResponse
    {
        $this->authorize('update', $aula);

        $url = $this->midia->salvar(
            $aula,
            $request->validated('alvo'),
            $request->validated('alvo_id') !== null ? (int) $request->validated('alvo_id') : null,
            $request->file('arquivo'),
        );

        return response()->json(['url' => $url]);
    }

    public function removerMidia(MidiaAulaRequest $request, Aula $aula): Response
    {
        $this->authorize('update', $aula);

        $this->midia->remover(
            $aula,
            $request->validated('alvo'),
            $request->validated('alvo_id') !== null ? (int) $request->validated('alvo_id') : null,
        );

        return response()->noContent();
    }

    public function sugerirFamilia(Request $request): JsonResponse
    {
        $dados = $request->validate(['silaba' => ['required', 'string', 'max:8', 'regex:/^\p{L}+$/u']]);

        return response()->json(['familia' => SugestorFamilia::para($dados['silaba'])]);
    }

    private function listar()
    {
        return Aula::query()
            ->ordenadas()
            ->withCount(['silabas', 'palavras', 'historiaPaginas', 'perguntas'])
            ->get();
    }
}
