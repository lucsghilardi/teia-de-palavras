<?php

namespace App\Services\Crianca;

use App\Models\Aula;
use App\Models\Configuracao;
use App\Models\Crianca;
use App\Models\Evento;
use App\Models\Sessao;

/**
 * Sessões de uso da criança (tempo por sessão, pausa sugerida) e registro de
 * eventos. Uma sessão acaba depois de alguns minutos sem atividade.
 */
class SessaoService
{
    public function atual(Crianca $crianca): Sessao
    {
        $sessao = Sessao::query()
            ->where('crianca_id', $crianca->id)
            ->whereNull('encerrada_em')
            ->latest('ultima_atividade_em')
            ->first();

        $limite = now()->subMinutes((int) config('teia.sessao.inatividade_minutos', 10));

        if ($sessao !== null && $sessao->ultima_atividade_em->lt($limite)) {
            $sessao->update(['encerrada_em' => $sessao->ultima_atividade_em]);
            $sessao = null;
        }

        return $sessao ?? Sessao::create([
            'crianca_id' => $crianca->id,
            'iniciada_em' => now(),
            'ultima_atividade_em' => now(),
            'origem' => 'individual',
        ]);
    }

    /** Marca atividade agora (abre sessão nova se a anterior expirou). */
    public function tocar(Crianca $crianca): Sessao
    {
        $sessao = $this->atual($crianca);
        $sessao->update(['ultima_atividade_em' => now()]);

        return $sessao;
    }

    /**
     * Batimento do app. `sugerir_pausa` é verdadeiro uma única vez por sessão,
     * quando ela passa do tempo configurado pelo educador.
     *
     * @return array{sessao_id: int, minutos: int, sugerir_pausa: bool}
     */
    public function pulso(Crianca $crianca): array
    {
        $sessao = $this->tocar($crianca);
        $minutos = (int) floor($sessao->iniciada_em->diffInSeconds(now(), true) / 60);
        $limite = max(1, (int) Configuracao::valor('minutos_pausa'));

        $sugerir = $minutos >= $limite
            && ! $sessao->eventos()->where('tipo', 'pausa_sugerida')->exists();

        if ($sugerir) {
            $this->registrar($crianca, 'pausa_sugerida', null, null, ['minutos' => $minutos], $sessao);
        }

        return ['sessao_id' => $sessao->id, 'minutos' => $minutos, 'sugerir_pausa' => $sugerir];
    }

    /** @param array<string, mixed> $dados */
    public function registrar(Crianca $crianca, string $tipo, ?Aula $aula = null, ?int $etapa = null, array $dados = [], ?Sessao $sessao = null): Evento
    {
        $sessao ??= $this->tocar($crianca);

        return Evento::create([
            'sessao_id' => $sessao->id,
            'crianca_id' => $crianca->id,
            'aula_id' => $aula?->id,
            'etapa' => $etapa,
            'tipo' => $tipo,
            'dados' => $dados === [] ? null : $dados,
            'ocorrido_em' => now(),
        ]);
    }
}
