<?php

use App\Services\Revisao\Leitner;
use Carbon\CarbonImmutable;

$hoje = CarbonImmutable::parse('2026-09-26');

it('acerto sobe uma caixa e afasta a próxima revisão pelo intervalo da caixa nova', function () use ($hoje) {
    $leitner = new Leitner([0, 1, 3, 7, 14, 30]);

    expect($leitner->acerto(0, $hoje))->toEqual(['caixa' => 1, 'proxima' => $hoje->addDay()])
        ->and($leitner->acerto(1, $hoje))->toEqual(['caixa' => 2, 'proxima' => $hoje->addDays(3)])
        ->and($leitner->acerto(3, $hoje))->toEqual(['caixa' => 4, 'proxima' => $hoje->addDays(14)]);
});

it('a caixa não passa da última; o intervalo é o dela', function () use ($hoje) {
    $leitner = new Leitner([0, 1, 3, 7, 14, 30]);

    expect($leitner->caixaMaxima())->toBe(5)
        ->and($leitner->acerto(5, $hoje))->toEqual(['caixa' => 5, 'proxima' => $hoje->addDays(30)])
        ->and($leitner->acerto(42, $hoje)['caixa'])->toBe(5)
        ->and($leitner->intervalo(99))->toBe(30)
        ->and($leitner->intervalo(-1))->toBe(0);
});

it('erro volta para a caixa 0 e marca para amanhã (nunca para hoje)', function () use ($hoje) {
    expect((new Leitner([0, 1, 3]))->erro($hoje))->toEqual(['caixa' => 0, 'proxima' => $hoje->addDay()])
        ->and((new Leitner([0, 0]))->erro($hoje)['proxima'])->toEqual($hoje->addDay());
});

it('lê os intervalos de config/teia.php', function () {
    config(['teia.revisao.intervalos_dias' => [0, 2, 5]]);

    $leitner = Leitner::padrao();

    expect($leitner->caixaMaxima())->toBe(2)
        ->and($leitner->intervalo(1))->toBe(2);
});
