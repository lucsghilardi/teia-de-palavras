<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Http\Resources\OpcaoVisualResource;
use App\Models\Configuracao;
use App\Models\Crianca;
use App\Models\CriancaConquista;
use App\Models\TeiaPalavra;
use App\Services\Crianca\GamificacaoCrianca;
use App\Services\Crianca\SessaoService;
use App\Services\Revisao\RevisaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerfilController extends Controller
{
    public function __construct(
        private readonly GamificacaoCrianca $gamificacao,
        private readonly SessaoService $sessoes,
        private readonly RevisaoService $revisao,
    ) {}

    public function eu(Request $request): JsonResponse
    {
        /** @var Crianca $crianca */
        $crianca = $request->user('crianca')->load(['avatar', 'turma:id,nome']);
        $stats = $this->gamificacao->estatisticas($crianca);

        return response()->json([
            'id' => $crianca->id,
            'apelido' => $crianca->apelido,
            'avatar' => $crianca->avatar ? new OpcaoVisualResource($crianca->avatar) : null,
            'usa_minusculas' => (bool) $crianca->usa_minusculas,
            'narracao_automatica' => (bool) $crianca->narracao_automatica,
            'turma' => ['id' => $crianca->turma->id, 'nome' => $crianca->turma->nome],
            'estrelas' => (int) $stats->xp_total,
            ...GamificacaoCrianca::resumoNivel((int) $stats->xp_total),
            'sequencia_dias' => (int) $stats->sequencia_atual,
            'maior_sequencia' => (int) $stats->maior_sequencia,
            'teia_total' => TeiaPalavra::where('crianca_id', $crianca->id)->count(),
            'medalhas_total' => CriancaConquista::where('crianca_id', $crianca->id)->count(),
            'revisao_devidos' => $this->revisao->devidos($crianca),
            'config' => [
                'heroi_nome' => Configuracao::valor('heroi_nome'),
                'fabrica_nome' => Configuracao::valor('fabrica_nome'),
                'minutos_pausa' => (int) Configuracao::valor('minutos_pausa'),
            ],
        ]);
    }

    public function pulso(Request $request): JsonResponse
    {
        return response()->json($this->sessoes->pulso($request->user('crianca')));
    }
}
