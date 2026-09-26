<?php

namespace App\Services\Roda;

use App\Events\DuplaAtualizada;
use App\Events\RodaAtualizada;
use App\Exceptions\RodaException;
use App\Http\Resources\OpcaoVisualResource;
use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\Dupla;
use App\Models\DuplaTentativa;
use App\Models\Silaba;
use App\Models\TeiaPalavra;
use App\Models\Turma;
use App\Models\TurmaSessao;
use App\Models\User;
use App\Services\Amizades\AmizadeService;
use App\Services\Atividades\RespostaService;
use App\Services\Audio\ResolverAudio;
use App\Services\Aulas\DesbloqueioService;
use App\Services\Aulas\MontadorAulaCrianca;
use App\Services\Crianca\GamificacaoCrianca;
use App\Services\Crianca\ProducaoService;
use App\Services\Crianca\SessaoService;
use App\Services\Crianca\TentativaService;
use App\Services\Palavras\FamiliasService;
use App\Support\Texto;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * A Roda: o educador conduz uma missão ao vivo ("seguir o líder") e as
 * crianças, em duplas automáticas, propõem e confirmam respostas numa
 * atividade (montar palavras ou qualquer avaliada). Crianças de turmas amigas
 * entram pelo código. Todo snapshot sai pelo Reverb; sem websocket, polling.
 */
class RodaService
{
    public const ACOES = ['iniciar', 'avancar', 'voltar', 'ir_etapa', 'pagina', 'item', 'encerrar'];

    public function __construct(
        private readonly MontadorAulaCrianca $montador,
        private readonly FamiliasService $familias,
        private readonly TentativaService $tentativas,
        private readonly RespostaService $respostas,
        private readonly ProducaoService $producoes,
        private readonly DesbloqueioService $desbloqueio,
        private readonly GamificacaoCrianca $gamificacao,
        private readonly SessaoService $sessoes,
        private readonly AmizadeService $amizades,
    ) {}

    // ---------- Educador ----------

    public function abertaDaTurma(int $turmaId): ?TurmaSessao
    {
        return TurmaSessao::abertas()->where('turma_id', $turmaId)->latest('id')->first();
    }

    public function abrir(Turma $turma, Aula $aula, User $educador): TurmaSessao
    {
        if ($this->abertaDaTurma((int) $turma->id) !== null) {
            throw new RodaException('Essa turma já tem uma roda aberta.');
        }

        if (! $aula->estaPublicada()) {
            throw new RodaException('A missão precisa estar publicada para virar uma roda.');
        }

        $roda = TurmaSessao::create([
            'turma_id' => $turma->id,
            'aula_id' => $aula->id,
            'educador_user_id' => $educador->id,
            'codigo' => $this->gerarCodigo(),
            'status' => TurmaSessao::AGUARDANDO,
            'etapa_atual' => 1,
            'estado' => ['pagina' => 0, 'item' => 0],
        ]);

        return $roda->load(['aula', 'turma']);
    }

    public function comandar(TurmaSessao $roda, string $acao, ?int $valor = null): TurmaSessao
    {
        if (! $roda->ehAberta()) {
            throw new RodaException('Essa roda já acabou.');
        }

        if ($acao === 'encerrar') {
            return $this->encerrar($roda);
        }

        $total = $roda->aula->totalAtividades() + 1;
        $zerado = ['pagina' => 0, 'item' => 0];

        switch ($acao) {
            case 'iniciar':
                $roda->etapa_atual = 1;
                $roda->estado = $zerado;
                break;
            case 'avancar':
                $roda->etapa_atual = min($total, (int) $roda->etapa_atual + 1);
                $roda->estado = $zerado;
                break;
            case 'voltar':
                $roda->etapa_atual = max(1, (int) $roda->etapa_atual - 1);
                $roda->estado = $zerado;
                break;
            case 'ir_etapa':
                $roda->etapa_atual = max(1, min($total, (int) $valor));
                $roda->estado = $zerado;
                break;
            case 'pagina':
            case 'item':
                $roda->estado = [...$roda->estadoAtual(), $acao => max(0, (int) $valor)];
                break;
            default:
                throw new RodaException('Comando desconhecido.');
        }

        if ($roda->status === TurmaSessao::AGUARDANDO) {
            $roda->status = TurmaSessao::EM_ANDAMENTO;
            $roda->iniciada_em ??= now();
        }

        $roda->save();
        $this->transmitir($roda);

        return $roda;
    }

    /** Fecha a roda: a missão fica concluída para quem participou (XP da missão na primeira vez). */
    public function encerrar(TurmaSessao $roda): TurmaSessao
    {
        DB::transaction(function () use ($roda) {
            $roda->update(['status' => TurmaSessao::ENCERRADA, 'encerrada_em' => now()]);
            $aula = $roda->aula;

            foreach ($roda->participantes as $crianca) {
                $jaConcluida = CriancaAula::where('crianca_id', $crianca->id)->where('aula_id', $aula->id)->where('status', CriancaAula::CONCLUIDA)->exists();
                $this->desbloqueio->concluir($crianca, $aula);
                $this->gamificacao->darXp($crianca, $jaConcluida ? 0 : (int) config('teia.xp.missao'));

                if (! $jaConcluida) {
                    $this->gamificacao->avaliarConquistas($crianca);
                    $this->sessoes->registrar($crianca, 'aula_concluida', $aula, $aula->totalAtividades() + 1, ['roda_id' => $roda->id]);
                }
            }
        });

        $roda->refresh();
        $this->transmitir($roda);

        return $roda;
    }

    /**
     * Refaz as duplas só com quem está na roda. `null` = automático (embaralha;
     * quem sobra brinca sozinho).
     *
     * @param  list<array{0: int, 1: int}>|null  $pares
     * @return Collection<int, Dupla>
     */
    public function duplas(TurmaSessao $roda, ?array $pares): Collection
    {
        $presentes = $roda->participantes()->wherePivotNull('saiu_em')->pluck('criancas.id')->map(fn ($id) => (int) $id)->all();

        if ($pares === null) {
            $ids = $presentes;
            shuffle($ids);
            $pares = [];

            for ($i = 0; $i + 1 < count($ids); $i += 2) {
                $pares[] = [$ids[$i], $ids[$i + 1]];
            }
        } else {
            $usadas = [];

            foreach ($pares as $par) {
                [$a, $b] = [(int) ($par[0] ?? 0), (int) ($par[1] ?? 0)];

                if ($a === $b || ! in_array($a, $presentes, true) || ! in_array($b, $presentes, true) || isset($usadas[$a]) || isset($usadas[$b])) {
                    throw new RodaException('As duplas precisam ser de crianças diferentes que estão na roda, cada uma numa dupla só.');
                }

                $usadas[$a] = $usadas[$b] = true;
            }
        }

        DB::transaction(function () use ($roda, $pares) {
            $roda->duplas()->delete();

            foreach ($pares as [$a, $b]) {
                Dupla::create(['turma_sessao_id' => $roda->id, 'crianca_a_id' => $a, 'crianca_b_id' => $b]);
            }
        });

        $roda->unsetRelation('duplas');
        $this->transmitir($roda);
        $duplas = $roda->duplas()->get();
        $duplas->each(fn (Dupla $d) => $this->transmitirDupla($d));

        return $duplas;
    }

    // ---------- Criança ----------

    /** A roda aberta que a criança pode ver: da própria turma, senão de uma turma amiga. */
    public function abertaPara(Crianca $crianca): ?TurmaSessao
    {
        $turmas = $this->amizades->turmasAlcancadas((int) $crianca->turma_id)->all();

        return TurmaSessao::abertas()
            ->whereIn('turma_id', $turmas)
            ->orderByRaw('case when turma_id = ? then 0 else 1 end', [(int) $crianca->turma_id])
            ->latest('id')
            ->first();
    }

    public function podeEntrar(Crianca $crianca, TurmaSessao $roda): bool
    {
        return $roda->ehAberta() && $this->amizades->saoAmigas((int) $crianca->turma_id, (int) $roda->turma_id);
    }

    public function entrar(Crianca $crianca, ?string $codigo): TurmaSessao
    {
        $roda = $codigo !== null && trim($codigo) !== ''
            ? TurmaSessao::abertas()->where('codigo', Turma::normalizarCodigo($codigo))->latest('id')->first()
            : $this->abertaPara($crianca);

        if ($roda === null || ! $this->podeEntrar($crianca, $roda)) {
            throw new RodaException('Não achei uma roda aberta para você.', 404);
        }

        DB::transaction(function () use ($crianca, $roda) {
            $pivot = $roda->participantes()->where('criancas.id', $crianca->id)->first()?->pivot;

            if ($pivot === null) {
                $roda->participantes()->attach($crianca->id, ['entrou_em' => now(), 'ultima_presenca_em' => now()]);
            } else {
                $roda->participantes()->updateExistingPivot($crianca->id, ['saiu_em' => null, 'ultima_presenca_em' => now()]);
            }

            $this->sessoes->tocar($crianca)->update(['turma_sessao_id' => $roda->id, 'origem' => 'turma']);
            $this->sessoes->registrar($crianca, 'roda_entrou', $roda->aula, null, ['roda_id' => $roda->id]);
        });

        $roda->unsetRelation('participantes');
        $this->transmitir($roda);

        return $roda;
    }

    public function participa(Crianca $crianca, TurmaSessao $roda): bool
    {
        return $roda->participantes()->where('criancas.id', $crianca->id)->exists();
    }

    public function sair(Crianca $crianca, TurmaSessao $roda): void
    {
        $roda->participantes()->updateExistingPivot($crianca->id, ['saiu_em' => now()]);
        $roda->unsetRelation('participantes');
        $this->transmitir($roda);
    }

    public function duplaDe(Crianca $crianca, TurmaSessao $roda): ?Dupla
    {
        return $roda->duplas()
            ->where(fn ($q) => $q->where('crianca_a_id', $crianca->id)->orWhere('crianca_b_id', $crianca->id))
            ->first();
    }

    /** Quem propõe agora: A começa; a vez passa a cada resposta; uma proposta aberta segura a vez. */
    public function vezDe(Dupla $dupla): int
    {
        $ultima = $dupla->tentativas()->latest('id')->first();

        if ($ultima === null) {
            return (int) $dupla->crianca_a_id;
        }

        if ($ultima->status === DuplaTentativa::PROPOSTA) {
            return (int) $ultima->proposta_por_crianca_id;
        }

        return $dupla->outra((int) $ultima->proposta_por_crianca_id);
    }

    /** @param array<string, mixed> $resposta */
    public function propor(Crianca $crianca, TurmaSessao $roda, array $resposta): Dupla
    {
        $dupla = $this->duplaDe($crianca, $roda) ?? throw new RodaException('Você está sem dupla nesta roda.');

        return DB::transaction(function () use ($crianca, $roda, $dupla, $resposta) {
            $dupla = Dupla::lockForUpdate()->findOrFail($dupla->id);

            if ($this->pendente($dupla) !== null) {
                throw new RodaException('Espere a resposta do seu par.', 409);
            }

            if ($this->vezDe($dupla) !== (int) $crianca->id) {
                throw new RodaException('Agora é a vez do seu par propor.', 403);
            }

            $atividade = $this->atividadeDaVez($roda);

            if ($atividade === null) {
                throw new RodaException('Essa etapa não é de responder em dupla.');
            }

            $silabas = isset($resposta['silabas']) && is_array($resposta['silabas']) ? array_values(array_map('strval', $resposta['silabas'])) : null;

            DuplaTentativa::create([
                'dupla_id' => $dupla->id,
                'atividade_ordem' => $atividade->ordem,
                'silabas' => $silabas,
                'resposta' => $resposta,
                'proposta_por_crianca_id' => $crianca->id,
                'status' => DuplaTentativa::PROPOSTA,
            ]);

            $this->sessoes->registrar($crianca, 'dupla_proposta', $roda->aula, (int) $atividade->ordem, ['roda_id' => $roda->id, 'dupla_id' => $dupla->id]);
            $this->transmitirDupla($dupla);

            return $dupla;
        });
    }

    /** O par responde: aceitar avalia a proposta PARA AS DUAS crianças; "vamos mudar" não avalia nada. */
    public function responder(Crianca $crianca, TurmaSessao $roda, bool $aceitar): Dupla
    {
        $dupla = $this->duplaDe($crianca, $roda) ?? throw new RodaException('Você está sem dupla nesta roda.');

        return DB::transaction(function () use ($crianca, $roda, $dupla, $aceitar) {
            $dupla = Dupla::lockForUpdate()->findOrFail($dupla->id);
            $tentativa = $this->pendente($dupla) ?? throw new RodaException('Não há proposta esperando resposta.', 409);

            if ((int) $tentativa->proposta_por_crianca_id === (int) $crianca->id) {
                throw new RodaException('Quem propôs espera o par responder.', 403);
            }

            if (! $aceitar) {
                $tentativa->update(['status' => DuplaTentativa::RECUSADA, 'respondida_em' => now()]);
                $this->sessoes->registrar($crianca, 'dupla_mudar', $roda->aula, (int) $tentativa->atividade_ordem, ['roda_id' => $roda->id]);
                $this->transmitirDupla($dupla);

                return $dupla;
            }

            $proponente = Crianca::findOrFail($tentativa->proposta_por_crianca_id);
            $aula = $roda->aula;
            $atividade = $aula->atividades->firstWhere('ordem', (int) $tentativa->atividade_ordem);
            $resultado = null;

            if ($atividade !== null && $atividade->tipo === 'montar_palavras') {
                $silabas = array_values(array_map('strval', (array) ($tentativa->silabas ?? [])));
                $pecas = $this->pecasDaRoda($roda);

                foreach ([$proponente, $crianca] as $c) {
                    $r = $this->tentativas->tentar($c, $aula, $silabas, $pecas, 'dupla');
                    $resultado ??= $r;
                }

                $tentativa->valida = (bool) ($resultado['valida'] ?? false);
                $tentativa->palavra_resultado = $resultado['palavra'] ?? null;
                $tentativa->dica = $resultado['dica'] ?? null;
            } elseif ($atividade !== null && $atividade->ehAvaliada()) {
                foreach ([$proponente, $crianca] as $c) {
                    $r = $this->respostas->responder($c, $aula, $atividade, (array) ($tentativa->resposta ?? []));
                    $resultado ??= $r;
                }

                $tentativa->valida = (bool) ($resultado['correta'] ?? false);
                $tentativa->dica = $resultado['dica'] ?? null;
            } else {
                throw new RodaException('Essa etapa não é de responder em dupla.');
            }

            $tentativa->status = DuplaTentativa::CONFIRMADA;
            $tentativa->resultado = $resultado;
            $tentativa->respondida_em = now();
            $tentativa->save();

            $this->sessoes->registrar($crianca, 'dupla_concordou', $aula, (int) $tentativa->atividade_ordem, ['roda_id' => $roda->id, 'valida' => $tentativa->valida]);
            $this->transmitirDupla($dupla);

            return $dupla;
        });
    }

    /** Sem dupla: tenta uma palavra com as peças da roda. @param list<string> $silabas */
    public function tentarSozinha(Crianca $crianca, TurmaSessao $roda, array $silabas): array
    {
        return $this->tentativas->tentar($crianca, $roda->aula, $silabas, $this->pecasDaRoda($roda));
    }

    /** Sem dupla: responde a atividade avaliada de ordem $ordem. @param array<string, mixed> $resposta */
    public function responderSozinha(Crianca $crianca, TurmaSessao $roda, int $ordem, array $resposta): array
    {
        $atividade = $roda->aula->atividades->firstWhere('ordem', $ordem);

        if ($atividade === null || ! $atividade->ehAvaliada()) {
            throw new RodaException('Essa etapa não é de responder.');
        }

        return $this->respostas->responder($crianca, $roda->aula, $atividade, $resposta);
    }

    /** @param list<string> $palavras */
    public function producao(Crianca $crianca, TurmaSessao $roda, array $palavras): array
    {
        return $this->producoes->registrar($crianca, $roda->aula, $palavras);
    }

    // ---------- Snapshots ----------

    /** @return array<string, mixed> RodaEstado (docs/api-roda.md) */
    public function estado(TurmaSessao $roda): array
    {
        $roda->loadMissing(['aula', 'turma:id,nome', 'participantes.avatar', 'duplas']);
        $total = $roda->aula->totalAtividades();

        return [
            'id' => $roda->id,
            'codigo' => $roda->codigo,
            'status' => $roda->status,
            'etapa_atual' => (int) $roda->etapa_atual,
            'total_etapas' => $total + 1,
            'estado' => $roda->estadoAtual(),
            'aula' => [
                'id' => $roda->aula->id,
                'titulo' => $roda->aula->titulo,
                'rotulo' => $roda->aula->rotuloExibido(),
                'disciplina' => $roda->aula->disciplina,
                'palavra_geradora' => $roda->aula->palavra_geradora,
                'total_atividades' => $total,
            ],
            'turma' => ['id' => $roda->turma->id, 'nome' => $roda->turma->nome],
            'participantes' => $roda->participantes
                ->sortBy(fn (Crianca $c) => $c->pivot->entrou_em)
                ->map(fn (Crianca $c) => [...$this->resumo($c), 'presente' => $c->pivot->saiu_em === null])
                ->values()
                ->all(),
            'duplas' => $roda->duplas->map(fn (Dupla $d) => ['id' => $d->id, 'crianca_a_id' => (int) $d->crianca_a_id, 'crianca_b_id' => (int) $d->crianca_b_id])->values()->all(),
            'iniciada_em' => $roda->iniciada_em?->toIso8601String(),
            'encerrada_em' => $roda->encerrada_em?->toIso8601String(),
            'created_at' => $roda->created_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> DuplaEstado (docs/api-roda.md) */
    public function estadoDupla(Dupla $dupla): array
    {
        $dupla->loadMissing(['criancaA.avatar', 'criancaB.avatar', 'sessao.aula']);
        $ultima = $dupla->tentativas()->latest('id')->first();
        $roda = $dupla->sessao;
        $audio = ResolverAudio::paraTurma((int) $roda->turma_id);

        $palavras = TeiaPalavra::query()
            ->whereIn('crianca_id', [$dupla->crianca_a_id, $dupla->crianca_b_id])
            ->where('origem', 'dupla')
            ->where('aula_id', $roda->aula_id)
            ->where('descoberta_em', '>=', $roda->created_at)
            ->orderBy('descoberta_em')
            ->get()
            ->unique('palavra_normalizada')
            ->map(fn (TeiaPalavra $p) => ['palavra' => $p->palavra_exibida, 'audio_url' => $audio->palavra($p->palavra_exibida)])
            ->values()
            ->all();

        return [
            'id' => $dupla->id,
            'roda_id' => (int) $dupla->turma_sessao_id,
            'criancas' => [$this->resumo($dupla->criancaA), $this->resumo($dupla->criancaB)],
            'vez_de' => $this->vezDe($dupla),
            'tentativa' => $ultima ? [
                'id' => $ultima->id,
                'atividade_ordem' => (int) $ultima->atividade_ordem,
                'resposta' => $ultima->resposta ?? ($ultima->silabas ? ['silabas' => $ultima->silabas] : []),
                'proposta_por' => (int) $ultima->proposta_por_crianca_id,
                'status' => $ultima->status,
                'valida' => $ultima->valida,
                'palavra' => $ultima->palavra_resultado,
                'dica' => $ultima->dica,
                'resultado' => $ultima->resultado,
            ] : null,
            'palavras' => $palavras,
        ];
    }

    /** @return array<string, mixed> o pacote que a criança recebe ao entrar/recarregar */
    public function pacote(Crianca $crianca, TurmaSessao $roda): array
    {
        $dupla = $this->duplaDe($crianca, $roda);

        return [
            'roda' => $this->estado($roda),
            'conteudo' => $this->montador->montarParaRoda($roda, $crianca),
            'eu' => $crianca->id,
            'dupla' => $dupla ? $this->estadoDupla($dupla) : null,
        ];
    }

    /** @return array<string, mixed> */
    public function pacotePainel(TurmaSessao $roda): array
    {
        $roda->loadMissing('turma');

        return [
            'roda' => $this->estado($roda),
            'conteudo' => $this->montador->montarParaRoda($roda),
            'criancas_da_turma' => $roda->turma->criancas()->with('avatar')->orderBy('apelido')->get()->map(fn (Crianca $c) => $this->resumo($c))->values()->all(),
            'duplas' => $roda->duplas()->get()->map(fn (Dupla $d) => $this->estadoDupla($d))->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    public function resumoAberta(TurmaSessao $roda): array
    {
        $roda->loadMissing(['aula', 'turma:id,nome']);

        return [
            'id' => $roda->id,
            'codigo' => $roda->codigo,
            'status' => $roda->status,
            'aula' => ['id' => $roda->aula->id, 'titulo' => $roda->aula->titulo, 'rotulo' => $roda->aula->rotuloExibido(), 'palavra_geradora' => $roda->aula->palavra_geradora],
            'turma' => ['id' => $roda->turma->id, 'nome' => $roda->turma->nome],
        ];
    }

    // ---------- Internos ----------

    private function pendente(Dupla $dupla): ?DuplaTentativa
    {
        return $dupla->tentativas()->where('status', DuplaTentativa::PROPOSTA)->latest('id')->first();
    }

    /** A atividade da etapa atual, se a dupla pode responder nela (montar palavras ou avaliada). */
    private function atividadeDaVez(TurmaSessao $roda)
    {
        $atividade = $roda->aula->atividades->firstWhere('ordem', (int) $roda->etapa_atual);

        if ($atividade === null || ! ($atividade->tipo === 'montar_palavras' || $atividade->ehAvaliada())) {
            return null;
        }

        return $atividade;
    }

    /** @return list<string> peças normalizadas liberadas até a missão da roda (as mesmas para a turma toda) */
    private function pecasDaRoda(TurmaSessao $roda): array
    {
        return $this->familias->liberadasAteAula($roda->aula)
            ->map(fn (Silaba $s) => Texto::normalizar($s->texto))
            ->unique()
            ->values()
            ->all();
    }

    /** @return array{id: int, apelido: string, avatar: array<string, mixed>|null} */
    private function resumo(Crianca $crianca): array
    {
        $crianca->loadMissing('avatar');

        return [
            'id' => $crianca->id,
            'apelido' => $crianca->apelido,
            'avatar' => $crianca->avatar ? (new OpcaoVisualResource($crianca->avatar))->resolve() : null,
        ];
    }

    private function gerarCodigo(): string
    {
        do {
            $codigo = Turma::gerarCodigo();
        } while (TurmaSessao::abertas()->where('codigo', $codigo)->exists());

        return $codigo;
    }

    private function transmitir(TurmaSessao $roda): void
    {
        $roda->unsetRelation('participantes');
        $roda->unsetRelation('duplas');
        event(new RodaAtualizada($roda->id, $this->estado($roda)));
    }

    private function transmitirDupla(Dupla $dupla): void
    {
        event(new DuplaAtualizada((int) $dupla->turma_sessao_id, $this->estadoDupla($dupla)));
    }
}
