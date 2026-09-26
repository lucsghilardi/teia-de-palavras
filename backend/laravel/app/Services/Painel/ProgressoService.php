<?php

namespace App\Services\Painel;

use App\Http\Resources\OpcaoVisualResource;
use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\CriancaConquista;
use App\Models\CriancaItem;
use App\Models\CriancaResposta;
use App\Models\MiniAula;
use App\Models\MiniAulaEntrega;
use App\Models\Sessao;
use App\Models\TeiaPalavra;
use App\Models\TurmaSessao;
use App\Services\Crianca\GamificacaoCrianca;

/**
 * O progresso de UMA criança para o adulto: o próprio caminho dela (missões
 * por planeta, revisão, respostas, mini-aulas, rodas, medalhas, uso). Nunca
 * compara crianças nem monta ranking.
 */
class ProgressoService
{
    /** @return array<string, mixed> */
    public function para(Crianca $crianca): array
    {
        $crianca->loadMissing(['avatar', 'turma:id,nome', 'estatisticas']);
        $stats = $crianca->estatisticas;
        $xp = (int) ($stats?->xp_total ?? 0);
        $progresso = CriancaAula::where('crianca_id', $crianca->id)->get()->keyBy('aula_id');
        $aulas = Aula::publicadas()->ordenadas()->get();

        $porDisciplina = collect(config('disciplinas'))
            ->map(function (array $info, string $chave) use ($aulas, $progresso) {
                $daDisciplina = $aulas->where('disciplina', $chave);
                $linhas = $daDisciplina->map(fn (Aula $a) => $progresso->get($a->id))->filter();

                return [
                    'chave' => $chave,
                    'nome' => $info['nome'],
                    'cor' => $info['cor'],
                    'icone' => $info['icone'],
                    'publicadas' => $daDisciplina->count(),
                    'concluidas' => $linhas->where('status', CriancaAula::CONCLUIDA)->count(),
                    'em_andamento' => $linhas->where('status', CriancaAula::EM_ANDAMENTO)->count(),
                ];
            })
            ->sortBy(fn (array $p) => config("disciplinas.{$p['chave']}.ordem", 99))
            ->values()
            ->all();

        $ultimasMissoes = CriancaAula::with('aula')
            ->where('crianca_id', $crianca->id)
            ->orderByRaw('coalesce(concluida_em, iniciada_em) desc')
            ->limit(10)
            ->get()
            ->filter(fn (CriancaAula $l) => $l->aula !== null)
            ->map(fn (CriancaAula $l) => [
                'id' => $l->aula->id,
                'rotulo' => $l->aula->rotuloExibido(),
                'titulo' => $l->aula->titulo,
                'disciplina' => $l->aula->disciplina,
                'status' => $l->status,
                'etapa_atual' => (int) $l->etapa_atual,
                'total_atividades' => $l->aula->totalAtividades(),
                'iniciada_em' => $l->iniciada_em?->toIso8601String(),
                'concluida_em' => $l->concluida_em?->toIso8601String(),
            ])
            ->values()
            ->all();

        $itens = CriancaItem::where('crianca_id', $crianca->id);
        $respostas = CriancaResposta::where('crianca_id', $crianca->id);
        $desde = now()->subDays(30);

        return [
            'crianca' => [
                'id' => $crianca->id,
                'apelido' => $crianca->apelido,
                'avatar' => $crianca->avatar ? (new OpcaoVisualResource($crianca->avatar))->resolve() : null,
                'turma' => $crianca->turma ? ['id' => $crianca->turma->id, 'nome' => $crianca->turma->nome] : null,
            ],
            'xp' => GamificacaoCrianca::resumoNivel($xp),
            'sequencia' => [
                'atual' => (int) ($stats?->sequencia_atual ?? 0),
                'maior' => (int) ($stats?->maior_sequencia ?? 0),
                'ultimo_dia_ativo' => $stats?->ultimo_dia_ativo?->toDateString(),
            ],
            'missoes' => ['por_disciplina' => $porDisciplina, 'ultimas' => $ultimasMissoes],
            'teia' => [
                'total' => TeiaPalavra::where('crianca_id', $crianca->id)->count(),
                'ultimas' => TeiaPalavra::where('crianca_id', $crianca->id)->latest('descoberta_em')->limit(12)->get()
                    ->map(fn (TeiaPalavra $p) => ['palavra' => $p->palavra_exibida, 'origem' => $p->origem, 'descoberta_em' => $p->descoberta_em?->toIso8601String()])
                    ->values()
                    ->all(),
            ],
            'revisao' => [
                'itens' => (clone $itens)->count(),
                'dominados' => (clone $itens)->dominados()->count(),
                'devidos' => (clone $itens)->devidos()->count(),
                'acertos' => (int) (clone $itens)->sum('acertos'),
                'erros' => (int) (clone $itens)->sum('erros'),
            ],
            'respostas' => [
                'itens' => (clone $respostas)->count(),
                'acertou' => (clone $respostas)->where('acertou', true)->count(),
                'acertou_na_primeira' => (clone $respostas)->where('acertou_na_primeira', true)->count(),
            ],
            'mini_aulas' => [
                'dadas' => MiniAula::where('autor_crianca_id', $crianca->id)->count(),
                'aprovadas' => MiniAula::where('autor_crianca_id', $crianca->id)->aprovadas()->count(),
                'recebidas' => MiniAulaEntrega::where('crianca_id', $crianca->id)->count(),
                'respondidas' => MiniAulaEntrega::where('crianca_id', $crianca->id)->where('status', MiniAulaEntrega::RESPONDIDA)->count(),
            ],
            'rodas' => [
                'participou' => TurmaSessao::whereHas('participantes', fn ($q) => $q->where('criancas.id', $crianca->id))->count(),
            ],
            'medalhas' => [
                'total' => count(config('conquistas')),
                'desbloqueadas' => CriancaConquista::where('crianca_id', $crianca->id)->count(),
                'ultimas' => CriancaConquista::where('crianca_id', $crianca->id)->latest('desbloqueada_em')->limit(6)->get()
                    ->map(fn (CriancaConquista $c) => [...GamificacaoCrianca::conquista($c->chave), 'desbloqueada_em' => $c->desbloqueada_em?->toIso8601String()])
                    ->values()
                    ->all(),
            ],
            'uso' => [
                'dias_ativos_30d' => Sessao::where('crianca_id', $crianca->id)->where('iniciada_em', '>=', $desde)
                    ->get()->map(fn (Sessao $s) => $s->iniciada_em->toDateString())->unique()->count(),
                'minutos_30d' => (int) Sessao::where('crianca_id', $crianca->id)->where('iniciada_em', '>=', $desde)->get()
                    ->sum(fn (Sessao $s) => max(0, $s->iniciada_em->diffInMinutes($s->encerrada_em ?? $s->ultima_atividade_em ?? $s->iniciada_em, true))),
            ],
        ];
    }
}
