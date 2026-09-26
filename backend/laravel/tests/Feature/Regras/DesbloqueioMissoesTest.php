<?php

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Services\Aulas\AulaEditorService;
use App\Services\Aulas\DesbloqueioService;

beforeEach(function () {
    semearConteudo();
    $this->crianca = Crianca::factory()->create();
    $this->desbloqueio = app(DesbloqueioService::class);
});

function statusNoMapa(Crianca $crianca): array
{
    return app(DesbloqueioService::class)->mapa($crianca)
        ->mapWithKeys(fn ($item) => [$item['aula']->palavra_geradora => $item['status']])
        ->all();
}

it('criança nova vê só a primeira missão disponível e o resto trancado', function () {
    expect(statusNoMapa($this->crianca))->toBe([
        'TEIA' => 'disponivel',
        'BONECA' => 'bloqueada',
        'PULO' => 'bloqueada',
        'MOLA' => 'bloqueada',
        'SALVA' => 'bloqueada',
    ]);
});

it('não mostra aulas em rascunho no mapa', function () {
    expect(array_keys(statusNoMapa($this->crianca)))->not->toContain('ARANHA', 'HERÓI');
});

it('concluir a missão desbloqueia o próximo capítulo e avisa qual foi', function () {
    $novas = $this->desbloqueio->concluir($this->crianca, aulaDaPalavra('TEIA'));

    expect($novas->pluck('palavra_geradora')->all())->toBe(['BONECA'])
        ->and(statusNoMapa($this->crianca))->toMatchArray([
            'TEIA' => 'concluida',
            'BONECA' => 'disponivel',
            'PULO' => 'bloqueada',
        ]);
});

it('iniciar uma missão a coloca em andamento na etapa 1', function () {
    $linha = $this->desbloqueio->iniciar($this->crianca, aulaDaPalavra('TEIA'));

    expect($linha->status)->toBe(CriancaAula::EM_ANDAMENTO)
        ->and($linha->etapa_atual)->toBe(1)
        ->and(statusNoMapa($this->crianca)['TEIA'])->toBe('em_andamento');
});

it('não deixa iniciar missão trancada nem rascunho', function () {
    expect(fn () => $this->desbloqueio->iniciar($this->crianca, aulaDaPalavra('BONECA')))
        ->toThrow(DomainException::class);

    expect($this->desbloqueio->podeIniciar($this->crianca, aulaDaPalavra('ARANHA')))->toBeFalse();
});

it('pré-requisito em rascunho é atravessado', function () {
    // Despublica BONECA: PULO passa a depender, na prática, de TEIA.
    app(AulaEditorService::class)->despublicar(aulaDaPalavra('BONECA'));

    expect(statusNoMapa($this->crianca))->not->toHaveKey('BONECA')
        ->and(statusNoMapa($this->crianca)['PULO'])->toBe('bloqueada');

    $this->desbloqueio->concluir($this->crianca, aulaDaPalavra('TEIA'));

    expect(statusNoMapa($this->crianca)['PULO'])->toBe('disponivel');
});

it('aula sem pré-requisito fica disponível para todos', function () {
    aulaDaPalavra('MOLA')->update(['pre_requisito_aula_id' => null]);

    expect(statusNoMapa($this->crianca)['MOLA'])->toBe('disponivel');
});

it('concluir de novo não desbloqueia nada nem quebra', function () {
    $this->desbloqueio->concluir($this->crianca, aulaDaPalavra('TEIA'));
    $novas = $this->desbloqueio->concluir($this->crianca, aulaDaPalavra('TEIA'));

    expect($novas)->toBeEmpty()
        ->and(CriancaAula::where('crianca_id', $this->crianca->id)->count())->toBe(1);
});

it('percorre as cinco missões da Fase 1 em ordem', function () {
    foreach (['TEIA', 'BONECA', 'PULO', 'MOLA', 'SALVA'] as $palavra) {
        expect($this->desbloqueio->podeIniciar($this->crianca, aulaDaPalavra($palavra)))->toBeTrue();
        $this->desbloqueio->iniciar($this->crianca, aulaDaPalavra($palavra));
        $this->desbloqueio->concluir($this->crianca, aulaDaPalavra($palavra));
    }

    expect(array_unique(array_values(statusNoMapa($this->crianca))))->toBe(['concluida'])
        ->and(Aula::publicadas()->count())->toBe(5);
});
