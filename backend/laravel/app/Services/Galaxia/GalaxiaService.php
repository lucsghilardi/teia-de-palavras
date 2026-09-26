<?php

namespace App\Services\Galaxia;

use App\Enums\Disciplina;
use App\Http\Controllers\Api\Crianca\MapaController;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Services\Aulas\DesbloqueioService;
use App\Services\MiniAulas\MiniAulaService;
use App\Services\Revisao\RevisaoService;
use Illuminate\Support\Collection;

/**
 * A Galáxia: um planeta por disciplina com o resumo do progresso e as
 * "escolhas do dia" (até 3 missões, uma por planeta, o planeta jogado há mais
 * tempo primeiro). Tudo pessoal: nada compara crianças.
 */
class GalaxiaService
{
    public const ESCOLHAS_DO_DIA = 3;

    public function __construct(
        private readonly DesbloqueioService $desbloqueio,
        private readonly RevisaoService $revisao,
        private readonly MiniAulaService $miniAulas,
    ) {}

    /** @return array<string, mixed> */
    public function montar(Crianca $crianca): array
    {
        $mapa = $this->desbloqueio->mapa($crianca);
        $ultimaJogada = $this->ultimaJogadaPorDisciplina($crianca);
        $planetas = [];

        foreach (Disciplina::ordenadas() as $disciplina) {
            $missoes = $mapa->filter(fn ($item) => $item['aula']->disciplina === $disciplina->value)->values();
            $proxima = $missoes->first(fn ($item) => $item['status'] === CriancaAula::EM_ANDAMENTO)
                ?? $missoes->first(fn ($item) => $item['status'] === CriancaAula::DISPONIVEL);

            $planetas[] = [
                ...$disciplina->toArray(),
                'publicadas' => $missoes->count(),
                'concluidas' => $missoes->where('status', CriancaAula::CONCLUIDA)->count(),
                'em_andamento' => $missoes->where('status', CriancaAula::EM_ANDAMENTO)->count(),
                'proxima' => $proxima ? MapaController::resumo($proxima['aula'], $proxima['status'], $proxima['etapa_atual']) : null,
                'jogado_em' => $ultimaJogada->get($disciplina->value),
            ];
        }

        $escolhas = collect($planetas)
            ->filter(fn ($p) => $p['proxima'] !== null)
            // Quem nunca jogou vem primeiro; depois, quem está há mais tempo sem jogar.
            ->sortBy(fn ($p) => $p['jogado_em'] ?? '')
            ->take(self::ESCOLHAS_DO_DIA)
            ->pluck('proxima')
            ->values();

        return [
            'planetas' => array_map(fn ($p) => collect($p)->except('jogado_em')->all(), $planetas),
            'escolhas_do_dia' => $escolhas,
            'revisao' => ['devidos' => $this->revisao->devidos($crianca)],
            'amigos' => ['novas' => $this->miniAulas->novas($crianca)],
        ];
    }

    /** @return Collection<string, string> disciplina => última atividade (ISO) */
    private function ultimaJogadaPorDisciplina(Crianca $crianca): Collection
    {
        return CriancaAula::query()
            ->where('crianca_aulas.crianca_id', $crianca->id)
            ->join('aulas', 'aulas.id', '=', 'crianca_aulas.aula_id')
            ->selectRaw('aulas.disciplina as disciplina, max(crianca_aulas.updated_at) as jogado_em')
            ->groupBy('aulas.disciplina')
            ->pluck('jogado_em', 'disciplina')
            ->map(fn ($valor) => (string) $valor);
    }
}
