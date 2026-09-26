<?php

namespace App\Services\Aulas;

use App\Models\Aula;
use App\Models\Configuracao;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\Silaba;
use App\Models\TeiaPalavra;
use App\Models\TurmaSessao;
use App\Services\Audio\ResolverAudio;
use App\Services\Palavras\FamiliasService;
use App\Support\Midia;
use App\Support\Texto;
use Illuminate\Support\Collection;

/**
 * Monta a aula como o app da criança precisa (docs/api-crianca.md, AulaCrianca):
 * textos com o nome do herói/fábrica, áudio já resolvido, peças acumuladas
 * para a criação e metas marcadas como encontradas.
 */
class MontadorAulaCrianca
{
    public function __construct(private readonly FamiliasService $familias) {}

    /** @return array<string, mixed> */
    public function montar(Crianca $crianca, Aula $aula, string $status): array
    {
        $progresso = CriancaAula::where('crianca_id', $crianca->id)->where('aula_id', $aula->id)->first();

        return $this->conteudo(
            $aula,
            ResolverAudio::para($crianca),
            $this->familias->disponiveisPara($crianca, $aula),
            $crianca,
            $status,
            $progresso?->etapa_atual ?? 1,
        );
    }

    /**
     * Conteúdo da missão numa Roda: peças da turma (até esta missão); metas e
     * Teia da criança quando houver (no painel do educador, sem criança).
     *
     * @return array<string, mixed>
     */
    public function montarParaRoda(TurmaSessao $roda, ?Crianca $crianca = null): array
    {
        $aula = $roda->aula;

        return $this->conteudo(
            $aula,
            ResolverAudio::paraTurma((int) $roda->turma_id),
            $this->familias->liberadasAteAula($aula),
            $crianca,
            $roda->status,
            (int) $roda->etapa_atual,
        );
    }

    /**
     * @param  Collection<int, Silaba>  $acumuladas
     * @return array<string, mixed>
     */
    private function conteudo(Aula $aula, ResolverAudio $audio, Collection $acumuladas, ?Crianca $crianca, string $status, int $etapa): array
    {
        $aula->loadMissing(['silabas.silaba', 'silabas.familia.silaba', 'historiaPaginas', 'perguntas', 'palavras']);

        $naTeia = $crianca
            ? TeiaPalavra::where('crianca_id', $crianca->id)->pluck('palavra_normalizada')->flip()
            : collect();
        $falada = fn (Silaba $s) => ['texto' => $s->texto, 'audio_url' => $audio->silaba($s)];

        return [
            'id' => $aula->id,
            'titulo' => $aula->titulo,
            'fase' => $aula->fase,
            'palavra_geradora' => $aula->palavra_geradora,
            'palavra_imagem_url' => Midia::url($aula->palavra_imagem_path),
            'palavra_audio_url' => $audio->palavra($aula->palavra_geradora, $aula->palavra_audio_path),
            'status' => $status,
            'etapa_atual' => $etapa,
            'etapas' => array_values(Aula::ETAPAS),
            'historia' => $aula->historiaPaginas->map(fn ($p) => [
                'texto' => Configuracao::aplicarPlaceholders($p->texto),
                'imagem_url' => Midia::url($p->imagem_path),
                'audio_url' => Midia::url($p->audio_path),
            ])->values(),
            'perguntas' => $aula->perguntas->map(fn ($q) => [
                'texto' => Configuracao::aplicarPlaceholders($q->texto),
                'audio_url' => Midia::url($q->audio_path),
            ])->values(),
            'palmas' => $aula->silabas->map(fn ($s) => $falada($s->silaba))->values(),
            'ficha' => $aula->silabas->map(fn ($s) => [
                'silaba' => $s->silaba->texto,
                'membros' => $s->familia->map(fn ($f) => $falada($f->silaba))->values(),
            ])->values(),
            'pecas' => $this->pecas($aula, $acumuladas, $falada),
            'metas' => $aula->palavras->map(fn ($p) => [
                'palavra' => $p->palavra,
                'silabas' => $p->silabas,
                'imagem_url' => Midia::url($p->imagem_path),
                'audio_url' => $audio->palavra($p->palavra, $p->audio_path),
                'encontrada' => $naTeia->has($p->palavra_normalizada),
            ])->values(),
            'teia' => $crianca
                ? TeiaPalavra::where('crianca_id', $crianca->id)
                    ->latest('descoberta_em')
                    ->limit(60)
                    ->get(['palavra_exibida'])
                    ->map(fn ($t) => ['palavra' => $t->palavra_exibida, 'audio_url' => $audio->palavra($t->palavra_exibida)])
                    ->values()
                : [],
            'palavrinhas' => config('teia.palavrinhas'),
        ];
    }

    /**
     * Peças da criação: primeiro as que esta aula libera (família, depois
     * palmas), depois as acumuladas de aulas anteriores. Sem repetir som:
     * FÁ (palma) some quando FA (família) já está na lista.
     *
     * @return list<array{texto: string, audio_url: string|null, da_aula: bool}>
     */
    private function pecas(Aula $aula, Collection $acumuladas, callable $falada): array
    {
        $daAula = $aula->silabas->flatMap(fn ($s) => $s->familia->pluck('silaba'))
            ->concat($aula->silabas->pluck('silaba'));

        $vistas = [];
        $saida = [];

        foreach ([[$daAula, true], [$acumuladas, false]] as [$lista, $ehDaAula]) {
            foreach ($lista as $silaba) {
                $chave = Texto::normalizar($silaba->texto);

                if (isset($vistas[$chave])) {
                    continue;
                }

                $vistas[$chave] = true;
                $saida[] = [...$falada($silaba), 'da_aula' => $ehDaAula];
            }
        }

        return $saida;
    }
}
