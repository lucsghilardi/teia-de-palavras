<?php

use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Services\Palavras\FamiliasService;
use App\Services\Palavras\ValidadorPalavras;

beforeEach(function () {
    semearConteudo();
    $this->crianca = Crianca::factory()->create();
    $this->familias = app(FamiliasService::class);
});

it('libera só as famílias da aula atual para quem está começando', function () {
    $textos = $this->familias->textosNormalizados($this->crianca, aulaDaPalavra('TEIA'));

    expect($textos)->toContain('TA', 'TE', 'TI', 'TO', 'TU', 'A', 'E', 'I', 'O', 'U', 'TEI')
        ->not->toContain('BA', 'CA', 'PA');
});

it('acumula as famílias das aulas anteriores', function () {
    progresso($this->crianca, aulaDaPalavra('TEIA'), CriancaAula::CONCLUIDA);
    progresso($this->crianca, aulaDaPalavra('BONECA'), CriancaAula::CONCLUIDA);

    $textos = $this->familias->textosNormalizados($this->crianca, aulaDaPalavra('PULO'));

    // TEIA (T + vogais) + BONECA (B, N, C) + PULO (P, L)
    expect($textos)->toContain('TA', 'TU', 'A', 'BA', 'BO', 'NA', 'NE', 'CA', 'CO', 'CU', 'PA', 'PI', 'LA', 'LU')
        ->not->toContain('MA', 'SA', 'VA');
});

it('conta aula em andamento e ignora aula só disponível', function () {
    progresso($this->crianca, aulaDaPalavra('TEIA'), CriancaAula::CONCLUIDA);
    progresso($this->crianca, aulaDaPalavra('BONECA'), CriancaAula::EM_ANDAMENTO);
    progresso($this->crianca, aulaDaPalavra('PULO'), CriancaAula::DISPONIVEL);

    $textos = $this->familias->textosNormalizados($this->crianca);

    expect($textos)->toContain('TA', 'BA', 'CA')->not->toContain('PA', 'LA');
});

it('PIPOCA só se forma na aula PULO se a família do C já veio da BONECA', function () {
    $validador = app(ValidadorPalavras::class);
    $pulo = aulaDaPalavra('PULO');

    // Sem BONECA no histórico, falta o CA.
    expect($validador->validar($this->crianca, $pulo, ['PI', 'PO', 'CA'])->valida)->toBeFalse();

    progresso($this->crianca, aulaDaPalavra('BONECA'), CriancaAula::CONCLUIDA);

    expect($validador->validar($this->crianca->fresh(), $pulo, ['PI', 'PO', 'CA'])->valida)->toBeTrue();
});

it('SALA usa o SA de SALVA com o LA de aulas anteriores', function () {
    $validador = app(ValidadorPalavras::class);
    $salva = aulaDaPalavra('SALVA');

    expect($validador->validar($this->crianca, $salva, ['SA', 'LA'])->valida)->toBeFalse();

    progresso($this->crianca, aulaDaPalavra('MOLA'), CriancaAula::CONCLUIDA);

    expect($validador->validar($this->crianca, $salva, ['SA', 'LA'])->valida)->toBeTrue();
});

it('devolve sílabas únicas na ordem em que foram liberadas', function () {
    progresso($this->crianca, aulaDaPalavra('PULO'), CriancaAula::CONCLUIDA);
    progresso($this->crianca, aulaDaPalavra('MOLA'), CriancaAula::CONCLUIDA);

    $textos = $this->familias->disponiveisPara($this->crianca)->pluck('texto')->all();

    // LA aparece nas duas aulas, mas só uma vez; P vem antes de M.
    expect(array_count_values($textos)['LA'])->toBe(1)
        ->and(array_search('PA', $textos))->toBeLessThan(array_search('MA', $textos));
});
