<?php

namespace App\Services\Aulas;

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use DomainException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Desbloqueio de missões. Uma aula publicada fica disponível quando não tem
 * pré-requisito ou quando o pré-requisito foi concluído pela criança. Um
 * pré-requisito em rascunho é "atravessado": vale o pré-requisito dele.
 * Aula bloqueada é calculada (não há linha em crianca_aulas).
 */
class DesbloqueioService
{
    public const BLOQUEADA = 'bloqueada';

    /**
     * Estado de cada aula publicada para a criança, na ordem do mapa.
     *
     * @return Collection<int, array{aula: Aula, status: string, etapa_atual: int|null}>
     */
    public function mapa(Crianca $crianca): Collection
    {
        $aulas = Aula::query()->ordenadas()->withCount('atividades')->get()->keyBy('id');
        $progresso = CriancaAula::query()->where('crianca_id', $crianca->id)->get()->keyBy('aula_id');
        $concluidas = $progresso->where('status', CriancaAula::CONCLUIDA)->keys()->all();

        return $aulas->filter(fn (Aula $a) => $a->estaPublicada())
            ->values()
            ->map(function (Aula $aula) use ($aulas, $progresso, $concluidas) {
                $linha = $progresso->get($aula->id);

                $status = match (true) {
                    $linha?->status === CriancaAula::CONCLUIDA => CriancaAula::CONCLUIDA,
                    $linha?->status === CriancaAula::EM_ANDAMENTO => CriancaAula::EM_ANDAMENTO,
                    $this->preRequisitoSatisfeito($aula, $aulas, $concluidas) => CriancaAula::DISPONIVEL,
                    default => self::BLOQUEADA,
                };

                return ['aula' => $aula, 'status' => $status, 'etapa_atual' => $linha?->etapa_atual];
            });
    }

    public function podeIniciar(Crianca $crianca, Aula $aula): bool
    {
        if (! $aula->estaPublicada()) {
            return false;
        }

        $estado = $this->mapa($crianca)->first(fn ($item) => $item['aula']->id === $aula->id);

        return $estado !== null && $estado['status'] !== self::BLOQUEADA;
    }

    /** Marca a aula como em andamento (idempotente). */
    public function iniciar(Crianca $crianca, Aula $aula): CriancaAula
    {
        if (! $this->podeIniciar($crianca, $aula)) {
            throw new DomainException('Esta missão ainda está trancada.');
        }

        $linha = CriancaAula::firstOrNew(['crianca_id' => $crianca->id, 'aula_id' => $aula->id]);

        if ($linha->status !== CriancaAula::CONCLUIDA) {
            $linha->status = CriancaAula::EM_ANDAMENTO;
            $linha->etapa_atual = $linha->etapa_atual ?: 1;
            $linha->iniciada_em ??= now();
            $linha->save();
        }

        return $linha;
    }

    /**
     * Linha de progresso da criança nesta aula; se a aula está aberta e ainda
     * não começou, inicia. Null quando a aula está trancada ou não publicada.
     */
    public function progressoOuIniciar(Crianca $crianca, Aula $aula): ?CriancaAula
    {
        $linha = CriancaAula::where('crianca_id', $crianca->id)->where('aula_id', $aula->id)->first();

        if ($linha !== null) {
            return $linha;
        }

        try {
            return $this->iniciar($crianca, $aula);
        } catch (DomainException) {
            return null;
        }
    }

    /**
     * Conclui a aula e devolve as aulas que acabaram de ser desbloqueadas
     * (para a tela de conquista anunciar o próximo capítulo).
     *
     * @return Collection<int, Aula>
     */
    public function concluir(Crianca $crianca, Aula $aula): Collection
    {
        return DB::transaction(function () use ($crianca, $aula) {
            $antes = $this->mapa($crianca)->where('status', self::BLOQUEADA)->pluck('aula.id')->all();

            $linha = CriancaAula::firstOrNew(['crianca_id' => $crianca->id, 'aula_id' => $aula->id]);
            $linha->status = CriancaAula::CONCLUIDA;
            $linha->etapa_atual = $aula->totalAtividades() + 1;
            $linha->iniciada_em ??= now();
            $linha->concluida_em ??= now();
            $linha->save();

            return $this->mapa($crianca)
                ->filter(fn ($item) => in_array($item['aula']->id, $antes, true) && $item['status'] !== self::BLOQUEADA)
                ->pluck('aula')
                ->values();
        });
    }

    /**
     * @param  Collection<int, Aula>  $aulas
     * @param  list<int>  $concluidas
     */
    private function preRequisitoSatisfeito(Aula $aula, Collection $aulas, array $concluidas): bool
    {
        $visitadas = [];
        $atual = $aula;

        while ($atual->pre_requisito_aula_id !== null) {
            $preId = $atual->pre_requisito_aula_id;

            if (isset($visitadas[$preId])) {
                return false; // ciclo: nunca libera (o CMS impede, mas não confiamos)
            }

            $visitadas[$preId] = true;
            $pre = $aulas->get($preId);

            if ($pre === null) {
                return true; // pré-requisito apagado
            }

            if (in_array($preId, $concluidas, true)) {
                return true;
            }

            if ($pre->estaPublicada()) {
                return false;
            }

            $atual = $pre; // rascunho: atravessa para o pré-requisito dele
        }

        return true;
    }
}
