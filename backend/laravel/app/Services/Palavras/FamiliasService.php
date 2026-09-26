<?php

namespace App\Services\Palavras;

use App\Enums\Disciplina;
use App\Models\Aula;
use App\Models\AulaFamilia;
use App\Models\AulaSilaba;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\Silaba;
use App\Support\Texto;
use Illuminate\Support\Collection;

/**
 * Famílias silábicas ACUMULADAS da criança: tudo que as aulas iniciadas ou
 * concluídas liberaram continua disponível para formar palavras novas.
 * Entram as famílias (ficha de descoberta) e as próprias sílabas da palavra
 * geradora (as "palmas"), para que a criança consiga remontá-la.
 */
class FamiliasService
{
    /**
     * @return Collection<int, Silaba> sílabas únicas por id, na ordem em que foram liberadas
     */
    public function disponiveisPara(Crianca $crianca, ?Aula $aulaAtual = null): Collection
    {
        $aulaIds = CriancaAula::query()
            ->where('crianca_id', $crianca->id)
            ->whereIn('status', [CriancaAula::EM_ANDAMENTO, CriancaAula::CONCLUIDA])
            ->pluck('aula_id');

        if ($aulaAtual !== null) {
            $aulaIds->push($aulaAtual->id);
        }

        return $this->liberadasPor($aulaIds->unique()->values()->all());
    }

    /**
     * Peças da Roda: o que a missão libera mais tudo das missões publicadas
     * que vêm antes dela no mapa. A turma inteira usa as mesmas peças.
     *
     * @return Collection<int, Silaba>
     */
    public function liberadasAteAula(Aula $aula): Collection
    {
        $ids = Aula::query()
            ->publicadas()
            ->daDisciplina(Disciplina::Portugues)
            ->where(fn ($q) => $q->where('fase', '<', $aula->fase)
                ->orWhere(fn ($q2) => $q2->where('fase', $aula->fase)->where('ordem', '<=', $aula->ordem)))
            ->pluck('id')
            ->push($aula->id)
            ->unique()
            ->values()
            ->all();

        return $this->liberadasPor($ids);
    }

    /**
     * Sílabas liberadas por um conjunto de aulas.
     *
     * @param  list<int>  $aulaIds
     * @return Collection<int, Silaba>
     */
    public function liberadasPor(array $aulaIds): Collection
    {
        if ($aulaIds === []) {
            return collect();
        }

        $ordemAulas = Aula::query()->whereIn('id', $aulaIds)->ordenadas()->pluck('id')->flip();

        $daFamilia = AulaFamilia::query()
            ->whereIn('aula_id', $aulaIds)
            ->get(['aula_id', 'silaba_id', 'ordem', 'aula_silaba_id']);

        $dasPalmas = AulaSilaba::query()
            ->whereIn('aula_id', $aulaIds)
            ->get(['aula_id', 'silaba_id', 'ordem']);

        $ids = $daFamilia->concat($dasPalmas)
            ->sortBy(fn ($linha) => [$ordemAulas[$linha->aula_id] ?? PHP_INT_MAX, $linha->ordem])
            ->pluck('silaba_id')
            ->unique()
            ->values();

        $silabas = Silaba::query()->whereIn('id', $ids)->get()->keyBy('id');

        return $ids->map(fn (int $id) => $silabas[$id])->values();
    }

    /**
     * Textos normalizados (caixa alta, sem acento) das sílabas disponíveis.
     *
     * @return list<string>
     */
    public function textosNormalizados(Crianca $crianca, ?Aula $aulaAtual = null): array
    {
        return $this->disponiveisPara($crianca, $aulaAtual)
            ->map(fn (Silaba $s) => Texto::normalizar($s->texto))
            ->unique()
            ->values()
            ->all();
    }
}
