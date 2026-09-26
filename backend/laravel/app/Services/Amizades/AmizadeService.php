<?php

namespace App\Services\Amizades;

use App\Models\Configuracao;
use App\Models\MiniAulaEntrega;
use App\Models\Turma;
use App\Models\TurmaAmizade;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Amizade entre turmas (LGPD): intenção do responsável A (gera um código de
 * uso único, 7 dias) + consentimento do responsável B (aceita com o termo
 * versionado). Qualquer lado encerra; as entregas de mini-aulas entre as
 * duas turmas somem.
 */
class AmizadeService
{
    public function gerar(Turma $turma, User $user): TurmaAmizade
    {
        return TurmaAmizade::create([
            'turma_a_id' => $turma->id,
            'codigo' => TurmaAmizade::gerarCodigo(),
            'status' => TurmaAmizade::PENDENTE,
            'gerada_por_user_id' => $user->id,
            'expira_em' => now()->addDays((int) config('teia.mini_aulas.amizade_dias', 7)),
        ]);
    }

    public function aceitar(Turma $turmaB, string $codigo, User $user, bool $termoAceito): TurmaAmizade
    {
        if (! $termoAceito) {
            throw ValidationException::withMessages(['termo_aceito' => 'É preciso aceitar o termo de amizade entre turmas.']);
        }

        $amizade = TurmaAmizade::where('codigo', Turma::normalizarCodigo($codigo))->first();

        if ($amizade === null || $amizade->status !== TurmaAmizade::PENDENTE) {
            throw ValidationException::withMessages(['codigo' => 'Código de amizade inválido ou já usado.']);
        }

        if ($amizade->expira_em->isPast()) {
            throw ValidationException::withMessages(['codigo' => 'Esse código venceu. Peça um novo ao outro responsável.']);
        }

        if ((int) $amizade->turma_a_id === (int) $turmaB->id) {
            throw ValidationException::withMessages(['turma_id' => 'Uma turma não pode ser amiga dela mesma.']);
        }

        if ($this->saoAmigas((int) $amizade->turma_a_id, (int) $turmaB->id)) {
            throw ValidationException::withMessages(['codigo' => 'Essas turmas já são amigas.']);
        }

        $amizade->update([
            'turma_b_id' => $turmaB->id,
            'status' => TurmaAmizade::ACEITA,
            'termo_versao' => Configuracao::valor('amizade_termo_versao'),
            'aceita_por_user_id' => $user->id,
            'aceita_em' => now(),
        ]);

        return $amizade->fresh();
    }

    /** Encerra a amizade e apaga as entregas de mini-aulas que só existiam por causa dela. */
    public function encerrar(TurmaAmizade $amizade): TurmaAmizade
    {
        $amizade->update(['status' => TurmaAmizade::ENCERRADA, 'encerrada_em' => now()]);

        if ($amizade->turma_b_id !== null) {
            foreach ([[$amizade->turma_a_id, $amizade->turma_b_id], [$amizade->turma_b_id, $amizade->turma_a_id]] as [$de, $para]) {
                MiniAulaEntrega::query()
                    ->whereHas('miniAula.autor', fn ($q) => $q->where('turma_id', $de))
                    ->whereHas('crianca', fn ($q) => $q->where('turma_id', $para))
                    ->delete();
            }
        }

        return $amizade->fresh();
    }

    /** @return Collection<int, int> ids das turmas amigas (amizade aceita) */
    public function turmasAmigas(int $turmaId): Collection
    {
        return TurmaAmizade::aceitas()->daTurma($turmaId)->get()->toBase()
            ->map(fn (TurmaAmizade $a) => $a->outraTurmaId($turmaId))
            ->filter()
            ->unique()
            ->values();
    }

    public function saoAmigas(int $turmaA, int $turmaB): bool
    {
        return $turmaA === $turmaB || $this->turmasAmigas($turmaA)->contains($turmaB);
    }

    /** Ids das turmas que podem receber conteúdo desta: ela mesma e as amigas. */
    public function turmasAlcancadas(int $turmaId): Collection
    {
        return $this->turmasAmigas($turmaId)->push($turmaId)->unique()->values();
    }

    /**
     * Amizades visíveis para o adulto: as das turmas dele (admin vê todas).
     *
     * @return Collection<int, TurmaAmizade>
     */
    public function visiveisPara(User $user): Collection
    {
        $turmas = $user->ehAdmin() ? null : Turma::where('educador_user_id', $user->id)->pluck('id');

        return TurmaAmizade::query()
            ->with(['turmaA:id,nome,educador_user_id', 'turmaB:id,nome,educador_user_id'])
            ->when($turmas !== null, fn ($q) => $q->where(fn ($w) => $w->whereIn('turma_a_id', $turmas)->orWhereIn('turma_b_id', $turmas)))
            ->orderByDesc('created_at')
            ->get();
    }
}
