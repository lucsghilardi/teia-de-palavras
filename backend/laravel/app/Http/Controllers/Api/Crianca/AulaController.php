<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\TeiaPalavra;
use App\Services\Audio\ResolverAudio;
use App\Services\Aulas\DesbloqueioService;
use App\Services\Aulas\MontadorAulaCrianca;
use App\Services\Crianca\GamificacaoCrianca;
use App\Services\Crianca\ProducaoService;
use App\Services\Crianca\SessaoService;
use App\Services\Crianca\TentativaService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Fluxo individual da aula (8 etapas): missão, conversa, palavra geradora,
 * palmas, ficha, criação, produção e conquista.
 */
class AulaController extends Controller
{
    private const TRANCADA = 'Essa missão ainda está trancada. Termine a anterior!';

    public function __construct(
        private readonly DesbloqueioService $desbloqueio,
        private readonly MontadorAulaCrianca $montador,
        private readonly SessaoService $sessoes,
        private readonly GamificacaoCrianca $gamificacao,
    ) {}

    public function show(Request $request, Aula $aula): JsonResponse
    {
        $crianca = $this->crianca($request);
        $status = $this->status($crianca, $aula);

        if ($status === null) {
            return $this->trancada();
        }

        return response()->json($this->montador->montar($crianca, $aula, $status));
    }

    public function iniciar(Request $request, Aula $aula): JsonResponse
    {
        $crianca = $this->crianca($request);

        try {
            $linha = $this->desbloqueio->iniciar($crianca, $aula);
        } catch (DomainException) {
            return $this->trancada();
        }

        if ($linha->wasRecentlyCreated) {
            $this->sessoes->registrar($crianca, 'aula_iniciada', $aula, 1);
        }

        $this->gamificacao->registrarDiaAtivo($crianca);

        return response()->json($this->montador->montar($crianca, $aula, $linha->status));
    }

    public function concluirEtapa(Request $request, Aula $aula, int $etapa): JsonResponse
    {
        $crianca = $this->crianca($request);
        $linha = $this->progresso($crianca, $aula);

        if ($linha === null) {
            return $this->trancada();
        }

        $total = $aula->totalAtividades();

        if ($etapa < 1 || $etapa > $total) {
            return response()->json(['message' => 'Essa etapa não existe.'], 422);
        }

        if ($linha->status === CriancaAula::CONCLUIDA) {
            return response()->json(['etapa_atual' => $linha->etapa_atual]);
        }

        if ($etapa > $linha->etapa_atual) {
            return response()->json(['message' => 'Vamos uma etapa de cada vez!'], 422);
        }

        if ($etapa + 1 > $linha->etapa_atual) {
            $linha->update(['etapa_atual' => $etapa + 1]);
        }

        $tipo = $aula->atividades()->where('ordem', $etapa)->value('tipo');
        $this->sessoes->registrar($crianca, 'etapa_concluida', $aula, $etapa, ['etapa' => $tipo]);

        return response()->json(['etapa_atual' => $linha->etapa_atual]);
    }

    public function tentativa(Request $request, Aula $aula, TentativaService $tentativas): JsonResponse
    {
        $dados = $request->validate([
            'silabas' => ['required', 'array', 'min:1', 'max:6'],
            'silabas.*' => ['required', 'string', 'max:8'],
        ]);

        $crianca = $this->crianca($request);

        if ($this->progresso($crianca, $aula) === null) {
            return $this->trancada();
        }

        return response()->json($tentativas->tentar($crianca, $aula, $dados['silabas']));
    }

    public function producao(Request $request, Aula $aula, ProducaoService $producoes): JsonResponse
    {
        $dados = $request->validate([
            'palavras' => ['required', 'array', 'max:12'],
            'palavras.*' => ['required', 'string', 'max:40'],
        ]);

        $crianca = $this->crianca($request);

        if ($this->progresso($crianca, $aula) === null) {
            return $this->trancada();
        }

        try {
            return response()->json($producoes->registrar($crianca, $aula, $dados['palavras']));
        } catch (DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function concluir(Request $request, Aula $aula): JsonResponse
    {
        $crianca = $this->crianca($request);
        $linha = $this->progresso($crianca, $aula);

        if ($linha === null) {
            return $this->trancada();
        }

        $jaConcluida = $linha->status === CriancaAula::CONCLUIDA;
        $conquista = $aula->totalAtividades() + 1;

        if (! $jaConcluida && $linha->etapa_atual < $conquista) {
            return response()->json(['message' => 'Ainda falta um pouquinho para terminar a missão!'], 422);
        }

        $desbloqueadas = $this->desbloqueio->concluir($crianca, $aula);
        $stats = $this->gamificacao->darXp($crianca, $jaConcluida ? 0 : (int) config('teia.xp.missao'));

        if (! $jaConcluida) {
            $this->sessoes->registrar($crianca, 'aula_concluida', $aula, $conquista);
        }

        $audio = ResolverAudio::para($crianca);

        return response()->json([
            'desbloqueadas' => $desbloqueadas->map(fn (Aula $a) => [
                'id' => $a->id,
                'titulo' => $a->titulo,
                'palavra_geradora' => $a->palavra_geradora,
            ])->values(),
            'xp_total' => (int) $stats->xp_total,
            'conquistas' => $this->gamificacao->avaliarConquistas($crianca),
            'palavras_da_missao' => TeiaPalavra::where('crianca_id', $crianca->id)
                ->where('aula_id', $aula->id)
                ->orderBy('descoberta_em')
                ->orderBy('id')
                ->get()
                ->map(fn ($t) => ['palavra' => $t->palavra_exibida, 'audio_url' => $audio->palavra($t->palavra_exibida)])
                ->values(),
        ]);
    }

    private function crianca(Request $request): Crianca
    {
        return $request->user('crianca');
    }

    /** Status no mapa, ou null se a aula está trancada/não publicada. */
    private function status(Crianca $crianca, Aula $aula): ?string
    {
        $item = $this->desbloqueio->mapa($crianca)->first(fn ($i) => $i['aula']->id === $aula->id);

        return ($item === null || $item['status'] === DesbloqueioService::BLOQUEADA) ? null : $item['status'];
    }

    /** Linha de progresso; inicia a aula se ela estiver aberta e ainda não começou. */
    private function progresso(Crianca $crianca, Aula $aula): ?CriancaAula
    {
        return $this->desbloqueio->progressoOuIniciar($crianca, $aula);
    }

    private function trancada(): JsonResponse
    {
        return response()->json(['message' => self::TRANCADA], 403);
    }
}
