<?php

namespace App\Http\Controllers\Api\Painel;

use App\Http\Controllers\Controller;
use App\Http\Resources\OpcaoVisualResource;
use App\Models\MiniAula;
use App\Models\Turma;
use App\Models\User;
use App\Services\MiniAulas\MiniAulaService;
use App\Support\ArquivoPrivado;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Fila de mini-aulas para o adulto ouvir, aprovar ou recusar. */
class MiniAulaController extends Controller
{
    public function __construct(private readonly MiniAulaService $miniAulas) {}

    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $status = (string) $request->query('status', MiniAula::PENDENTE);

        $lista = MiniAula::query()
            ->when(in_array($status, [MiniAula::PENDENTE, MiniAula::APROVADA, MiniAula::RECUSADA], true), fn ($q) => $q->where('status', $status))
            ->whereHas('autor', fn ($q) => $q->when(! $user->ehAdmin(), fn ($w) => $w->whereIn('turma_id', Turma::where('educador_user_id', $user->id)->select('id'))))
            ->with(['autor.avatar', 'autor.turma:id,nome', 'aulaOrigem:id,titulo,rotulo,palavra_geradora', 'gravacao', 'revisadaPor:id,name'])
            ->withCount(['entregas', 'entregas as respondidas_count' => fn ($q) => $q->where('status', 'respondida')])
            ->orderByDesc('created_at')
            ->limit(100)
            ->get();

        return response()->json($lista->map(fn (MiniAula $m) => $this->resumo($m))->values());
    }

    public function aprovar(Request $request, MiniAula $miniAula): JsonResponse
    {
        $this->autorizar($request->user(), $miniAula);

        return response()->json($this->resumo($this->miniAulas->aprovar($miniAula, $request->user())->loadCount('entregas')));
    }

    public function recusar(Request $request, MiniAula $miniAula): JsonResponse
    {
        $this->autorizar($request->user(), $miniAula);
        $dados = $request->validate(['motivo' => ['nullable', 'string', 'max:200']]);

        return response()->json($this->resumo($this->miniAulas->recusar($miniAula, $request->user(), $dados['motivo'] ?? null)->loadCount('entregas')));
    }

    /** O áudio (disco privado) para o adulto escutar antes de aprovar. */
    public function audio(Request $request, MiniAula $miniAula): Response
    {
        $this->autorizar($request->user(), $miniAula);
        $gravacao = $miniAula->gravacao()->withTrashed()->first();

        abort_if($gravacao === null || $miniAula->status === MiniAula::RECUSADA, 404);

        return ArquivoPrivado::resposta(MiniAulaService::DISCO, $gravacao->arquivo_path);
    }

    private function autorizar(User $user, MiniAula $miniAula): void
    {
        $miniAula->loadMissing('autor.turma');

        abort_unless($user->ehAdmin() || (int) $miniAula->autor?->turma?->educador_user_id === (int) $user->id, 403);
    }

    /** @return array<string, mixed> */
    private function resumo(MiniAula $m): array
    {
        $m->loadMissing(['autor.avatar', 'autor.turma:id,nome', 'aulaOrigem:id,titulo,rotulo,palavra_geradora']);

        return [
            'id' => $m->id,
            'status' => $m->status,
            'disciplina' => $m->disciplina,
            'tipo' => $m->tipo,
            'titulo' => $m->titulo,
            'config' => $m->config,
            'autor' => $m->autor ? [
                'id' => $m->autor->id,
                'apelido' => $m->autor->apelido,
                'avatar' => $m->autor->avatar ? (new OpcaoVisualResource($m->autor->avatar))->resolve() : null,
                'turma' => $m->autor->turma ? ['id' => $m->autor->turma->id, 'nome' => $m->autor->turma->nome] : null,
            ] : null,
            'aula_origem' => $m->aulaOrigem ? ['id' => $m->aulaOrigem->id, 'titulo' => $m->aulaOrigem->titulo, 'rotulo' => $m->aulaOrigem->rotuloExibido()] : null,
            'audio_url' => $m->status === MiniAula::RECUSADA ? null : "/painel/mini-aulas/{$m->id}/audio",
            'duracao_ms' => $m->gravacao?->duracao_ms,
            'entregas' => (int) ($m->entregas_count ?? 0),
            'respondidas' => (int) ($m->respondidas_count ?? 0),
            'motivo_recusa' => $m->motivo_recusa,
            'revisada_por' => $m->revisadaPor?->name,
            'revisada_em' => $m->revisada_em?->toIso8601String(),
            'created_at' => $m->created_at?->toIso8601String(),
        ];
    }
}
