<?php

namespace App\Services\Crianca;

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\CriancaConquista;
use App\Models\CriancaEstatistica;
use App\Models\CriancaItem;
use App\Models\Producao;
use App\Models\TeiaPalavra;

/**
 * Estrelas, sequência de dias e conquistas da criança. Tudo é pessoal: não há
 * ranking nem comparação entre crianças (regra 4 do escopo).
 */
class GamificacaoCrianca
{
    public function estatisticas(Crianca $crianca): CriancaEstatistica
    {
        return CriancaEstatistica::firstOrCreate(
            ['crianca_id' => $crianca->id],
            ['xp_total' => 0, 'nivel' => 1, 'sequencia_atual' => 0, 'maior_sequencia' => 0],
        );
    }

    public function darEstrelas(Crianca $crianca, int $quantidade): CriancaEstatistica
    {
        $stats = $this->registrarDiaAtivo($crianca);

        if ($quantidade > 0) {
            $stats->xp_total += $quantidade;
            $stats->nivel = self::nivelPara((int) $stats->xp_total);
            $stats->save();
        }

        return $stats;
    }

    /** Nível = quantos limiares da tabela config('teia.niveis') o XP já passou (mínimo 1). */
    public static function nivelPara(int $xp): int
    {
        $limiares = array_values(array_map('intval', (array) config('teia.niveis', [0, 10])));
        $nivel = 0;

        foreach ($limiares as $limiar) {
            if ($xp >= $limiar) {
                $nivel++;
            }
        }

        return max(1, $nivel);
    }

    /**
     * Resumo do nível para a criança ver a barra de XP.
     *
     * @return array{xp: int, nivel: int, xp_no_nivel: int, xp_para_proximo: int|null}
     */
    public static function resumoNivel(int $xp): array
    {
        $limiares = array_values(array_map('intval', (array) config('teia.niveis', [0, 10])));
        $nivel = self::nivelPara($xp);
        $base = $limiares[$nivel - 1] ?? 0;
        $proximo = $limiares[$nivel] ?? null;

        return [
            'xp' => $xp,
            'nivel' => $nivel,
            'xp_no_nivel' => $xp - $base,
            'xp_para_proximo' => $proximo === null ? null : $proximo - $base,
        ];
    }

    /** Dias seguidos com atividade (hoje conta uma vez). */
    public function registrarDiaAtivo(Crianca $crianca): CriancaEstatistica
    {
        $stats = $this->estatisticas($crianca);
        $hoje = today();

        if ($stats->ultimo_dia_ativo?->isSameDay($hoje)) {
            return $stats;
        }

        $stats->sequencia_atual = $stats->ultimo_dia_ativo?->isSameDay($hoje->copy()->subDay())
            ? $stats->sequencia_atual + 1
            : 1;
        $stats->maior_sequencia = max($stats->maior_sequencia, $stats->sequencia_atual);
        $stats->ultimo_dia_ativo = $hoje;
        $stats->save();

        return $stats;
    }

    /**
     * Desbloqueia o que a criança acabou de alcançar.
     *
     * @return list<array{chave: string, titulo: string, descricao: string, emoji: string}>
     */
    public function avaliarConquistas(Crianca $crianca): array
    {
        $ja = CriancaConquista::where('crianca_id', $crianca->id)->pluck('chave')->all();
        $novas = [];

        foreach ($this->regras($crianca) as $chave => $alcancou) {
            if (in_array($chave, $ja, true) || ! $alcancou()) {
                continue;
            }

            CriancaConquista::create(['crianca_id' => $crianca->id, 'chave' => $chave, 'desbloqueada_em' => now()]);
            $novas[] = self::conquista($chave);
        }

        return $novas;
    }

    /** @return array{chave: string, titulo: string, descricao: string, emoji: string, icone: string} */
    public static function conquista(string $chave): array
    {
        $dados = config("conquistas.{$chave}", ['titulo' => $chave, 'descricao' => '', 'emoji' => '⭐', 'icone' => 'star']);

        return [
            'chave' => $chave,
            'titulo' => $dados['titulo'],
            'descricao' => $dados['descricao'],
            'emoji' => $dados['emoji'] ?? '⭐',
            'icone' => $dados['icone'] ?? 'star',
        ];
    }

    private function concluiuNaDisciplina(Crianca $crianca, string $disciplina): bool
    {
        return CriancaAula::query()
            ->where('crianca_id', $crianca->id)
            ->where('status', CriancaAula::CONCLUIDA)
            ->whereIn('aula_id', Aula::daDisciplina($disciplina)->select('id'))
            ->exists();
    }

    private function acertosNaRevisao(Crianca $crianca): int
    {
        return (int) CriancaItem::where('crianca_id', $crianca->id)->sum('acertos');
    }

    /** @return array<string, callable(): bool> */
    private function regras(Crianca $crianca): array
    {
        $teia = fn () => TeiaPalavra::where('crianca_id', $crianca->id)->count();
        $concluidas = fn () => CriancaAula::where('crianca_id', $crianca->id)->where('status', CriancaAula::CONCLUIDA);

        return [
            'primeira_palavra' => fn () => $teia() >= 1,
            'teia_10' => fn () => $teia() >= 10,
            'teia_25' => fn () => $teia() >= 25,
            'primeira_frase' => fn () => Producao::where('crianca_id', $crianca->id)->exists(),
            'missao_1' => fn () => $concluidas()->exists(),
            'fase_1' => function () use ($concluidas) {
                $fase1 = Aula::publicadas()->where('fase', 1)->pluck('id');

                return $fase1->isNotEmpty()
                    && $concluidas()->whereIn('aula_id', $fase1)->count() === $fase1->count();
            },
            'tres_dias' => fn () => $this->estatisticas($crianca)->maior_sequencia >= 3,
            'sete_dias' => fn () => $this->estatisticas($crianca)->maior_sequencia >= 7,
            'ajudou_amigo' => fn () => TeiaPalavra::where('crianca_id', $crianca->id)->where('origem', 'dupla')->exists(),
            'planeta_matematica_1' => fn () => $this->concluiuNaDisciplina($crianca, 'matematica'),
            'planeta_geografia_1' => fn () => $this->concluiuNaDisciplina($crianca, 'geografia'),
            'planeta_historia_1' => fn () => $this->concluiuNaDisciplina($crianca, 'historia'),
            'revisao_10' => fn () => $this->acertosNaRevisao($crianca) >= 10,
            'revisao_50' => fn () => $this->acertosNaRevisao($crianca) >= 50,
        ];
    }
}
