<?php

namespace App\Services\MiniAulas;

use App\Http\Resources\OpcaoVisualResource;
use App\Models\Aula;
use App\Models\Crianca;
use App\Models\Gravacao;
use App\Models\MiniAula;
use App\Models\MiniAulaEntrega;
use App\Models\User;
use App\Services\Amizades\AmizadeService;
use App\Services\Atividades\ContextoAtividade;
use App\Services\Atividades\RegistroAtividades;
use App\Services\Audio\ResolverAudio;
use App\Services\Crianca\GamificacaoCrianca;
use App\Services\Crianca\SessaoService;
use App\Services\Revisao\RevisaoService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Mini-aulas: criar (áudio + desafio, numa transação), aprovar/recusar por um
 * adulto (aprovar entrega para a turma da autora e as turmas amigas; recusar
 * apaga o arquivo), listar, montar e responder com a mesma política de
 * feedback das atividades. Áudio sempre no disco privado.
 */
class MiniAulaService
{
    public const DISCO = 'local';

    public function __construct(
        private readonly ModelosMiniAula $modelos,
        private readonly AmizadeService $amizades,
        private readonly GamificacaoCrianca $gamificacao,
        private readonly SessaoService $sessoes,
        private readonly RevisaoService $revisao,
    ) {}

    public function criar(Crianca $autora, Aula $aula, string $modeloChave, int $semente, UploadedFile $audio, ?int $duracaoMs): MiniAula
    {
        $porDia = (int) config('teia.mini_aulas.por_dia', 10);

        if (MiniAula::where('autor_crianca_id', $autora->id)->whereDate('created_at', today())->count() >= $porDia) {
            throw ValidationException::withMessages(['audio' => 'Você já gravou muitas aulas hoje. Amanhã tem mais!']);
        }

        $modelo = $this->modelos->resolver($autora, $aula, $modeloChave, $semente);

        if ($modelo === null) {
            throw ValidationException::withMessages(['modelo' => 'Esse modelo não existe mais. Escolha outro.']);
        }

        $maxMs = (int) config('teia.mini_aulas.duracao_max_s', 60) * 1000;

        if ($duracaoMs !== null && $duracaoMs > $maxMs) {
            throw ValidationException::withMessages(['duracao_ms' => 'A gravação é longa demais.']);
        }

        $config = RegistroAtividades::para($modelo['tipo'])->validarConfig($modelo['config']);

        return DB::transaction(function () use ($autora, $aula, $modelo, $modeloChave, $audio, $duracaoMs, $config) {
            $extensao = strtolower($audio->getClientOriginalExtension() ?: $audio->extension() ?: 'webm');
            $path = $audio->storeAs("mini-aulas/{$autora->id}", Str::uuid().'.'.$extensao, self::DISCO);

            if ($path === false) {
                throw ValidationException::withMessages(['audio' => 'Não foi possível guardar o áudio.']);
            }

            $gravacao = Gravacao::create([
                'crianca_id' => $autora->id,
                'alvo_tipo' => 'mini_aula',
                'aula_id' => $aula->id,
                'arquivo_path' => $path,
                'duracao_ms' => $duracaoMs,
                'mime' => $audio->getClientMimeType(),
                'status' => Gravacao::PENDENTE,
            ]);

            $miniAula = MiniAula::create([
                'autor_crianca_id' => $autora->id,
                'disciplina' => $aula->disciplina,
                'aula_origem_id' => $aula->id,
                'modelo' => $modeloChave,
                'titulo' => $modelo['titulo'],
                'tipo' => $modelo['tipo'],
                'config' => $config,
                'gravacao_id' => $gravacao->id,
                'status' => MiniAula::PENDENTE,
            ]);

            $gravacao->update(['alvo_id' => $miniAula->id]);
            $this->sessoes->registrar($autora, 'mini_aula_criada', $aula, null, ['mini_aula_id' => $miniAula->id]);

            return $miniAula;
        });
    }

    /** Aprova a gravação e a mini-aula, entrega para a turma da autora e as turmas amigas, dá XP à autora. */
    public function aprovar(MiniAula $miniAula, User $adulto): MiniAula
    {
        return DB::transaction(function () use ($miniAula, $adulto) {
            $miniAula->update(['status' => MiniAula::APROVADA, 'revisada_por_user_id' => $adulto->id, 'revisada_em' => now(), 'motivo_recusa' => null]);
            $miniAula->gravacao?->update(['status' => Gravacao::APROVADA, 'revisada_por_user_id' => $adulto->id, 'revisada_em' => now()]);

            $autora = $miniAula->autor;
            $turmas = $this->amizades->turmasAlcancadas((int) $autora->turma_id);

            Crianca::query()
                ->whereIn('turma_id', $turmas)
                ->where('id', '!=', $autora->id)
                ->pluck('id')
                ->each(fn ($id) => MiniAulaEntrega::firstOrCreate(['mini_aula_id' => $miniAula->id, 'crianca_id' => $id], ['status' => MiniAulaEntrega::RECEBIDA]));

            $this->gamificacao->darEstrelas($autora, (int) config('teia.mini_aulas.xp_dada', 3));
            $this->gamificacao->avaliarConquistas($autora);

            return $miniAula->fresh(['gravacao', 'autor']);
        });
    }

    /** Recusa: a mini-aula fica registrada (sem circular) e o áudio é apagado do disco. */
    public function recusar(MiniAula $miniAula, User $adulto, ?string $motivo): MiniAula
    {
        return DB::transaction(function () use ($miniAula, $adulto, $motivo) {
            $miniAula->update(['status' => MiniAula::RECUSADA, 'revisada_por_user_id' => $adulto->id, 'revisada_em' => now(), 'motivo_recusa' => $motivo]);
            $miniAula->entregas()->delete();

            if ($gravacao = $miniAula->gravacao) {
                Storage::disk(self::DISCO)->delete($gravacao->arquivo_path);
                $gravacao->update(['status' => Gravacao::RECUSADA, 'revisada_por_user_id' => $adulto->id, 'revisada_em' => now()]);
                $gravacao->delete();
            }

            return $miniAula->fresh();
        });
    }

    /** @return Collection<int, MiniAulaEntrega> entregas aprovadas para a criança, novas primeiro */
    public function recebidas(Crianca $crianca): Collection
    {
        return MiniAulaEntrega::query()
            ->where('crianca_id', $crianca->id)
            ->whereHas('miniAula', fn ($q) => $q->aprovadas()->whereHas('autor'))
            ->with(['miniAula.autor.avatar', 'miniAula.gravacao'])
            ->orderByRaw("case when status = 'recebida' then 0 else 1 end")
            ->orderByDesc('created_at')
            ->get();
    }

    public function novas(Crianca $crianca): int
    {
        return MiniAulaEntrega::query()
            ->where('crianca_id', $crianca->id)
            ->where('status', MiniAulaEntrega::RECEBIDA)
            ->whereHas('miniAula', fn ($q) => $q->aprovadas()->whereHas('autor'))
            ->count();
    }

    /** @return Collection<int, MiniAula> as mini-aulas da criança, com contagens (nunca ranking) */
    public function minhas(Crianca $crianca): Collection
    {
        return MiniAula::query()
            ->where('autor_crianca_id', $crianca->id)
            ->withCount(['entregas as respondidas' => fn ($q) => $q->where('status', MiniAulaEntrega::RESPONDIDA)])
            ->with('entregas:id,mini_aula_id,reacao')
            ->orderByDesc('created_at')
            ->limit(30)
            ->get();
    }

    /** @return array<string, mixed> */
    public function resumoEntrega(MiniAulaEntrega $entrega): array
    {
        $mini = $entrega->miniAula;
        $autor = $mini->autor;

        return [
            'id' => $entrega->id,
            'status' => $entrega->status,
            'correta' => $entrega->correta,
            'reacao' => $entrega->reacao,
            'mini_aula' => [
                'id' => $mini->id,
                'titulo' => $mini->titulo,
                'disciplina' => $mini->disciplina,
                'tipo' => $mini->tipo,
                'autor' => ['apelido' => $autor->apelido, 'avatar' => $autor->avatar ? (new OpcaoVisualResource($autor->avatar))->resolve() : null],
                'audio_url' => $mini->gravacao_id ? ResolverAudio::urlGravacao((int) $mini->gravacao_id) : null,
                'created_at' => $mini->created_at?->toIso8601String(),
            ],
        ];
    }

    /** @return array<string, mixed> */
    public function montar(Crianca $crianca, MiniAulaEntrega $entrega): array
    {
        $mini = $entrega->miniAula;
        $atividade = ModelosMiniAula::atividadeVirtual($mini->tipo, $mini->configArray());
        $aula = $this->aulaVirtual($mini);
        $contexto = new ContextoAtividade($crianca, $aula, ResolverAudio::para($crianca), [], ContextoAtividade::semente($crianca, $aula, (int) $entrega->id));

        return [
            'ordem' => 1,
            'tipo' => $mini->tipo,
            'titulo' => $mini->titulo,
            'instrucao' => null,
            'imagem_url' => null,
            'avaliada' => true,
            ...$atividade->avaliador()->montar($atividade, $contexto),
        ];
    }

    /**
     * Responde o desafio com a política padrão: dica no 1º erro, resposta no
     * 2º; XP no primeiro acerto (para quem responde e, com teto, para a autora).
     *
     * @param  array<string, mixed>  $resposta
     * @return array<string, mixed>
     */
    public function responder(Crianca $crianca, MiniAulaEntrega $entrega, array $resposta): array
    {
        return DB::transaction(function () use ($crianca, $entrega, $resposta) {
            $entrega = MiniAulaEntrega::lockForUpdate()->findOrFail($entrega->id);
            $mini = $entrega->miniAula;
            $aula = $this->aulaVirtual($mini);
            $contexto = new ContextoAtividade($crianca, $aula, ResolverAudio::para($crianca), [], ContextoAtividade::semente($crianca, $aula, (int) $entrega->id));
            $resultado = $mini->avaliador()->avaliar($mini->configArray(), $resposta, $contexto);

            $jaResolvida = $entrega->status === MiniAulaEntrega::RESPONDIDA;
            $entrega->tentativas = (int) $entrega->tentativas + 1;
            $entrega->resposta = $resposta;
            $mostrarResposta = ! $resultado->correta && $entrega->tentativas >= (int) config('teia.tentativas_ate_resposta', 2);
            $primeiroAcerto = $resultado->correta && ! $jaResolvida;

            if ($resultado->correta || $mostrarResposta) {
                $entrega->status = MiniAulaEntrega::RESPONDIDA;
                $entrega->correta = $entrega->correta === true || $resultado->correta;
                $entrega->respondida_em ??= now();
                $this->revisao->registrar($crianca, $resultado);
            }

            $entrega->save();

            $xp = $primeiroAcerto ? (int) config('teia.mini_aulas.xp_respondida', 1) : 0;
            $stats = $this->gamificacao->darEstrelas($crianca, $xp);
            $conquistas = $entrega->status === MiniAulaEntrega::RESPONDIDA ? $this->gamificacao->avaliarConquistas($crianca) : [];

            if ($primeiroAcerto) {
                $this->premiarAutora($mini);
            }

            $this->sessoes->registrar($crianca, $resultado->correta ? 'mini_aula_certa' : 'mini_aula_errada', null, null, ['mini_aula_id' => $mini->id]);
            $entregue = $mostrarResposta ? $resultado : $resultado->semRespostaCorreta();

            return [
                ...$entregue->toArray(),
                'xp_ganho' => $xp,
                'tentativas' => (int) $entrega->tentativas,
                'resolvido' => $entrega->status === MiniAulaEntrega::RESPONDIDA,
                'revisao_agendada' => $mostrarResposta,
                'xp_total' => (int) $stats->xp_total,
                'nivel' => (int) $stats->nivel,
                'conquistas' => $conquistas,
            ];
        });
    }

    public function reagir(MiniAulaEntrega $entrega, string $reacao): MiniAulaEntrega
    {
        $entrega->update(['reacao' => $reacao]);

        return $entrega;
    }

    /** XP para a autora a cada amigo que acerta, com teto por mini-aula (contra farming). */
    private function premiarAutora(MiniAula $mini): void
    {
        $teto = (int) config('teia.mini_aulas.teto_xp_autora', 10);
        $porAcerto = (int) config('teia.mini_aulas.xp_autora_por_acerto', 1);

        if ($mini->xp_autora + $porAcerto > $teto || ! $mini->autor) {
            $this->gamificacao->avaliarConquistas($mini->autor ?? $mini->autor()->withTrashed()->first() ?? new Crianca);

            return;
        }

        $mini->increment('xp_autora', $porAcerto);
        $this->gamificacao->darEstrelas($mini->autor, $porAcerto);
        $this->gamificacao->avaliarConquistas($mini->autor);
    }

    private function aulaVirtual(MiniAula $mini): Aula
    {
        $aula = new Aula(['disciplina' => $mini->disciplina, 'titulo' => $mini->titulo, 'fase' => 0]);
        $aula->id = 0;

        return $aula;
    }
}
