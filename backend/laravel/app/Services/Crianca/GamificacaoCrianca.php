<?php

namespace App\Services\Crianca;

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\CriancaConquista;
use App\Models\CriancaEstatistica;
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
            $stats->nivel = 1 + intdiv($stats->xp_total, 10);
            $stats->save();
        }

        return $stats;
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

    /** @return array{chave: string, titulo: string, descricao: string, emoji: string} */
    public static function conquista(string $chave): array
    {
        $dados = config("conquistas.{$chave}", ['titulo' => $chave, 'descricao' => '', 'emoji' => '⭐']);

        return ['chave' => $chave, 'titulo' => $dados['titulo'], 'descricao' => $dados['descricao'], 'emoji' => $dados['emoji']];
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
            'ajudou_amigo' => fn () => TeiaPalavra::where('crianca_id', $crianca->id)->where('origem', 'dupla')->exists(),
        ];
    }
}
