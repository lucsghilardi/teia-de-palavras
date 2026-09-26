<?php

namespace App\Services\Revisao;

use App\Models\Aula;
use App\Models\AulaAtividade;
use App\Models\Crianca;
use App\Models\CriancaItem;
use App\Services\Atividades\ContextoAtividade;
use App\Services\Atividades\RegistroAtividades;
use App\Services\Atividades\ResultadoAtividade;
use App\Services\Audio\ResolverAudio;
use App\Services\Crianca\GamificacaoCrianca;
use App\Services\Crianca\SessaoService;
use Illuminate\Support\Collection;

/**
 * Revisão espaçada: registra os itens que as atividades avaliadas produzem,
 * monta a "Revisão" do dia com os itens vencidos (caixas mais baixas
 * primeiro) e move as caixas conforme a resposta.
 */
class RevisaoService
{
    public function __construct(
        private readonly GamificacaoCrianca $gamificacao,
        private readonly SessaoService $sessoes,
    ) {}

    /**
     * Atualiza (ou cria) os itens de revisão de um resultado. `correta` sobe a
     * caixa; erro volta para a caixa 0 e marca para amanhã.
     */
    public function registrar(Crianca $crianca, ResultadoAtividade $resultado): void
    {
        $leitner = Leitner::padrao();

        foreach ($resultado->itensRevisao as $dados) {
            $item = CriancaItem::firstOrNew(['crianca_id' => $crianca->id, 'chave' => mb_substr($dados['chave'], 0, 80)]);

            if (! $item->exists) {
                $item->disciplina = (string) ($dados['disciplina'] ?? 'portugues');
                $item->caixa = 0;
                $item->proxima_revisao_em = today();
            }

            $item->dados = $dados['dados'];
            $this->mover($item, $resultado->correta, $leitner);
            $item->save();
        }
    }

    public function devidos(Crianca $crianca): int
    {
        return CriancaItem::where('crianca_id', $crianca->id)->devidos()->count();
    }

    /**
     * Itens vencidos para revisar agora, os de caixa mais baixa primeiro.
     *
     * @return Collection<int, CriancaItem>
     */
    public function itensDaSessao(Crianca $crianca, ?int $limite = null): Collection
    {
        $limite ??= (int) config('teia.revisao.itens_por_sessao', 6);

        return CriancaItem::query()
            ->where('crianca_id', $crianca->id)
            ->devidos()
            ->orderBy('caixa')
            ->orderBy('proxima_revisao_em')
            ->orderBy('id')
            ->limit($limite)
            ->get();
    }

    /**
     * O item como uma atividade de um só item, montada pelo registro de tipos.
     *
     * @return array<string, mixed>
     */
    public function montar(Crianca $crianca, CriancaItem $item, int $ordem): array
    {
        $atividade = $this->atividadeVirtual($item, $ordem);
        $contexto = new ContextoAtividade($crianca, $this->aulaVirtual($item), ResolverAudio::para($crianca), [], ContextoAtividade::semente($crianca, $this->aulaVirtual($item), $ordem + (int) $item->id));

        return [
            'ordem' => $ordem,
            'tipo' => $atividade->tipo,
            'titulo' => null,
            'instrucao' => null,
            'imagem_url' => null,
            'avaliada' => true,
            ...$atividade->avaliador()->montar($atividade, $contexto),
        ];
    }

    /**
     * Responde um item da revisão: avalia pelo tipo, move a caixa e dá XP no
     * acerto. Na revisão a resposta certa aparece já no primeiro erro (é
     * treino, não prova).
     *
     * @param  array<string, mixed>  $resposta
     * @return array<string, mixed>
     */
    public function responder(Crianca $crianca, CriancaItem $item, array $resposta): array
    {
        $atividade = $this->atividadeVirtual($item, 1);
        $aula = $this->aulaVirtual($item);
        $contexto = new ContextoAtividade($crianca, $aula, ResolverAudio::para($crianca), [], ContextoAtividade::semente($crianca, $aula, 1 + (int) $item->id));
        $resultado = $atividade->avaliador()->avaliar($item->configArray(), $resposta, $contexto);

        $this->mover($item, $resultado->correta, Leitner::padrao());
        $item->save();

        $xp = $resultado->correta ? (int) config('teia.xp.revisao_item', 1) : 0;
        $stats = $this->gamificacao->darXp($crianca, $xp);
        $conquistas = $resultado->correta ? $this->gamificacao->avaliarConquistas($crianca) : [];

        $this->sessoes->registrar($crianca, $resultado->correta ? 'revisao_certa' : 'revisao_errada', null, null, [
            'chave' => $item->chave,
            'caixa' => $item->caixa,
        ]);

        return [
            ...$resultado->toArray(),
            'xp_ganho' => $xp,
            'tentativas' => 1,
            'resolvido' => true,
            'revisao_agendada' => ! $resultado->correta,
            'caixa' => $item->caixa,
            'proxima_revisao_em' => $item->proxima_revisao_em?->toDateString(),
            'xp_total' => (int) $stats->xp_total,
            'nivel' => (int) $stats->nivel,
            'conquistas' => $conquistas,
        ];
    }

    private function mover(CriancaItem $item, bool $correta, Leitner $leitner): void
    {
        $movimento = $correta ? $leitner->acerto((int) $item->caixa, today()) : $leitner->erro(today());

        $item->caixa = $movimento['caixa'];
        $item->proxima_revisao_em = $movimento['proxima'];
        $item->ultimo_resultado = $correta;
        $item->revisado_em = now();

        if ($correta) {
            $item->acertos = (int) $item->acertos + 1;
        } else {
            $item->erros = (int) $item->erros + 1;
        }
    }

    private function atividadeVirtual(CriancaItem $item, int $ordem): AulaAtividade
    {
        $tipo = RegistroAtividades::existe($item->tipo()) ? $item->tipo() : 'escolha';

        return new AulaAtividade(['aula_id' => 0, 'ordem' => $ordem, 'tipo' => $tipo, 'config' => $item->configArray()]);
    }

    private function aulaVirtual(CriancaItem $item): Aula
    {
        $aula = new Aula(['disciplina' => $item->disciplina, 'titulo' => 'Revisão', 'fase' => 0]);
        $aula->id = 0;

        return $aula;
    }
}
