<?php

namespace App\Services\Audio;

use App\Models\AulaPalavra;
use App\Models\Crianca;
use App\Models\Gravacao;
use App\Models\Palavra;
use App\Models\Silaba;
use App\Support\Midia;
use App\Support\Texto;

/**
 * Escolhe o áudio de uma sílaba ou palavra seguindo a prioridade do escopo:
 *   1. gravação aprovada, feita por uma criança da MESMA turma (privacidade);
 *   2. arquivo de áudio cadastrado no CMS;
 *   3. null → o app fala com a Web Speech API pt-BR.
 *
 * Criado por criança (`para`), carrega as gravações aprovadas da turma de uma
 * vez, para montar uma aula inteira sem uma consulta por peça.
 */
class ResolverAudio
{
    /** @var array<string, array<int, int>> alvo_tipo => [alvo_id => gravacao_id] */
    private array $gravacoes = [];

    /** @var array<string, int|null> palavra normalizada => palavras.id */
    private array $idsPalavras = [];

    /** @var array<string, string|null> palavra normalizada => audio_path do CMS */
    private array $audiosCms = [];

    public static function para(Crianca $crianca): self
    {
        return self::paraTurma((int) $crianca->turma_id);
    }

    /** Resolve com as gravações aprovadas das crianças desta turma. */
    public static function paraTurma(int $turmaId): self
    {
        $resolver = new self;

        Gravacao::query()
            ->aprovadas()
            ->whereIn('alvo_tipo', ['silaba', 'palavra'])
            ->whereHas('crianca', fn ($q) => $q->where('turma_id', $turmaId))
            ->orderBy('revisada_em')
            ->get(['id', 'alvo_tipo', 'alvo_id'])
            ->each(function (Gravacao $g) use ($resolver) {
                // A mais recente sobrescreve as anteriores.
                $resolver->gravacoes[$g->alvo_tipo][(int) $g->alvo_id] = $g->id;
            });

        return $resolver;
    }

    public function silaba(Silaba $silaba): ?string
    {
        if (isset($this->gravacoes['silaba'][$silaba->id])) {
            return self::urlGravacao($this->gravacoes['silaba'][$silaba->id]);
        }

        return Midia::url($silaba->audio_path);
    }

    /** Áudio de uma palavra pelo texto (qualquer grafia/acento). */
    public function palavra(string $palavra, ?string $audioPathCms = null): ?string
    {
        $normalizada = Texto::normalizar($palavra);

        if (! array_key_exists($normalizada, $this->idsPalavras)) {
            $this->idsPalavras[$normalizada] = Palavra::where('palavra_normalizada', $normalizada)->value('id');
        }

        $id = $this->idsPalavras[$normalizada];

        if ($id !== null && isset($this->gravacoes['palavra'][$id])) {
            return self::urlGravacao($this->gravacoes['palavra'][$id]);
        }

        if ($audioPathCms !== null) {
            return Midia::url($audioPathCms);
        }

        if (! array_key_exists($normalizada, $this->audiosCms)) {
            $this->audiosCms[$normalizada] = AulaPalavra::where('palavra_normalizada', $normalizada)
                ->whereNotNull('audio_path')
                ->value('audio_path');
        }

        return Midia::url($this->audiosCms[$normalizada]);
    }

    /** Gravações ficam no disco privado: o app as busca pelo proxy da criança. */
    public static function urlGravacao(int $gravacaoId): string
    {
        return "/api/crianca-proxy/audios/{$gravacaoId}";
    }
}
