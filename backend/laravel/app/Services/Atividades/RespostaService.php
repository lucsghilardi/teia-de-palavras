<?php

namespace App\Services\Atividades;

use App\Models\Aula;
use App\Models\AulaAtividade;
use App\Models\Crianca;
use App\Models\CriancaResposta;
use App\Services\Audio\ResolverAudio;
use App\Services\Crianca\GamificacaoCrianca;
use App\Services\Crianca\SessaoService;
use App\Services\Revisao\RevisaoService;
use Illuminate\Support\Facades\DB;

/**
 * Uma resposta a uma atividade avaliada: avalia pelo tipo, grava a tentativa,
 * aplica a política de feedback (dica no 1º erro, resposta certa a partir do
 * 2º), dá XP só no primeiro acerto do item e registra o evento.
 */
class RespostaService
{
    public function __construct(
        private readonly GamificacaoCrianca $gamificacao,
        private readonly SessaoService $sessoes,
        private readonly RevisaoService $revisao,
    ) {}

    /**
     * @param  array<string, mixed>  $resposta
     * @return array<string, mixed> resposta de docs/api-crianca.md (responder)
     */
    public function responder(Crianca $crianca, Aula $aula, AulaAtividade $atividade, array $resposta): array
    {
        $contexto = new ContextoAtividade(
            $crianca,
            $aula,
            ResolverAudio::para($crianca),
            [],
            ContextoAtividade::semente($crianca, $aula, $atividade->ordem),
        );

        $resultado = $atividade->avaliador()->avaliar($atividade->configArray(), $resposta, $contexto);
        $ateResposta = max(1, (int) config('teia.tentativas_ate_resposta', 2));

        [$linha, $primeiroAcerto] = DB::transaction(function () use ($crianca, $atividade, $resultado, $resposta) {
            $linha = CriancaResposta::query()->lockForUpdate()->firstOrNew([
                'crianca_id' => $crianca->id,
                'aula_atividade_id' => $atividade->id,
                'item' => mb_substr($resultado->item, 0, 40),
            ]);

            $primeiroAcerto = $resultado->correta && ! $linha->acertou;
            $linha->tentativas = ($linha->tentativas ?? 0) + 1;
            $linha->ultima_resposta = $resposta;

            if ($resultado->correta) {
                $linha->acertou = true;
                $linha->acertou_na_primeira ??= $linha->tentativas === 1;
            } elseif ($linha->acertou_na_primeira === null && $linha->tentativas >= 1) {
                $linha->acertou_na_primeira = false;
            }

            $linha->save();

            return [$linha, $primeiroAcerto];
        });

        $mostrarResposta = ! $resultado->correta && $linha->tentativas >= $ateResposta;
        $entregue = $mostrarResposta ? $resultado : $resultado->semRespostaCorreta();

        // Revisão espaçada: acerto sobe a caixa; erro que já mostrou a resposta volta para a caixa 0.
        if ($resultado->correta || $mostrarResposta) {
            $this->revisao->registrar($crianca, $resultado);
        }

        $xp = ($primeiroAcerto && ! $resultado->xpCreditado) ? $resultado->xp : 0;
        $stats = $this->gamificacao->darXp($crianca, $xp);
        $conquistas = $primeiroAcerto ? $this->gamificacao->avaliarConquistas($crianca) : [];

        $this->sessoes->registrar($crianca, $resultado->correta ? 'resposta_certa' : 'resposta_errada', $aula, $atividade->ordem, [
            'tipo' => $atividade->tipo,
            'item' => $resultado->item,
            'tentativas' => $linha->tentativas,
        ]);

        return [
            ...$entregue->toArray(),
            'xp_ganho' => $primeiroAcerto ? ($resultado->xpCreditado ? $resultado->xp : $xp) : 0,
            'tentativas' => (int) $linha->tentativas,
            // Resolvido = acertou, ou já viu a resposta certa: a criança pode seguir.
            'resolvido' => $resultado->correta || $mostrarResposta,
            'revisao_agendada' => $mostrarResposta,
            'xp_total' => (int) $stats->xp_total,
            'nivel' => (int) $stats->nivel,
            'conquistas' => $conquistas,
        ];
    }
}
