<?php

namespace App\Services\Revisao;

use Carbon\CarbonInterface;

/**
 * As caixas de Leitner: acerto sobe uma caixa e afasta a próxima revisão;
 * erro volta para a caixa 0 e marca para amanhã. Puro (sem banco) para ser
 * testável; os intervalos vêm de config/teia.php.
 */
final class Leitner
{
    /** @param list<int> $intervalosDias intervalo (em dias) de cada caixa, da 0 em diante */
    public function __construct(private readonly array $intervalosDias) {}

    public static function padrao(): self
    {
        return new self(array_values(array_map('intval', (array) config('teia.revisao.intervalos_dias', [0, 1, 3, 7, 14, 30]))));
    }

    public function caixaMaxima(): int
    {
        return max(0, count($this->intervalosDias) - 1);
    }

    /** @return array{caixa: int, proxima: CarbonInterface} */
    public function acerto(int $caixa, CarbonInterface $hoje): array
    {
        $nova = min($this->caixaMaxima(), max(0, $caixa) + 1);

        return ['caixa' => $nova, 'proxima' => $hoje->copy()->addDays($this->intervalo($nova))];
    }

    /** @return array{caixa: int, proxima: CarbonInterface} */
    public function erro(CarbonInterface $hoje): array
    {
        return ['caixa' => 0, 'proxima' => $hoje->copy()->addDays(max(1, $this->intervalo(1)))];
    }

    public function intervalo(int $caixa): int
    {
        return $this->intervalosDias[min(max(0, $caixa), $this->caixaMaxima())] ?? 0;
    }
}
