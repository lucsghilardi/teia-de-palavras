<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Enums\Disciplina;
use App\Http\Controllers\Controller;
use App\Models\Aula;
use App\Services\Aulas\DesbloqueioService;
use App\Support\Midia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Missões publicadas com o estado de cada uma para a criança; `?disciplina=` filtra um planeta. */
class MapaController extends Controller
{
    public function __invoke(Request $request, DesbloqueioService $desbloqueio): JsonResponse
    {
        $disciplina = Disciplina::tryFrom((string) $request->query('disciplina', ''));

        $missoes = $desbloqueio->mapa($request->user('crianca'))
            ->filter(fn ($item) => $disciplina === null || $item['aula']->disciplina === $disciplina->value)
            ->map(fn ($item) => self::resumo($item['aula'], $item['status'], $item['etapa_atual']))
            ->values();

        return response()->json(['missoes' => $missoes]);
    }

    /** @return array<string, mixed> */
    public static function resumo(Aula $aula, string $status, ?int $etapaAtual): array
    {
        return [
            'id' => $aula->id,
            'titulo' => $aula->titulo,
            'descricao' => $aula->descricao,
            'disciplina' => $aula->disciplina,
            'rotulo' => $aula->rotuloExibido(),
            'fase' => $aula->fase,
            'ordem' => $aula->ordem,
            'palavra_geradora' => $aula->palavra_geradora,
            'palavra_imagem_url' => Midia::url($aula->palavra_imagem_path),
            'status' => $status,
            'etapa_atual' => $etapaAtual,
            'total_atividades' => $aula->totalAtividades(),
        ];
    }
}
