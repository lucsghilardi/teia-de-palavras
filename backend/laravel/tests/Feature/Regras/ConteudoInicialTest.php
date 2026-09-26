<?php

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\OpcaoVisual;
use App\Services\Palavras\ValidadorPalavras;
use Database\Seeders\ConteudoInicialSeeder;

beforeEach(fn () => semearConteudo());

it('semeia as 10 missões: Fase 1 publicada e Fase 2 em rascunho', function () {
    expect(Aula::count())->toBe(10)
        ->and(Aula::where('fase', 1)->publicadas()->pluck('palavra_geradora')->all())
        ->toBe(['TEIA', 'BONECA', 'PULO', 'MOLA', 'SALVA'])
        ->and(Aula::where('fase', 2)->where('status', 'rascunho')->count())->toBe(5);
});

it('encadeia cada missão à anterior', function () {
    $aulas = Aula::query()->ordenadas()->get();

    expect($aulas->first()->pre_requisito_aula_id)->toBeNull();

    foreach ($aulas->skip(1)->values() as $i => $aula) {
        expect($aula->pre_requisito_aula_id)->toBe($aulas[$i]->id);
    }
});

it('todas as palavras de cada missão são formáveis com as famílias acumuladas', function () {
    $crianca = Crianca::factory()->create();
    $validador = app(ValidadorPalavras::class);

    foreach (Aula::query()->ordenadas()->with('palavras')->get() as $aula) {
        foreach ($aula->palavras as $palavra) {
            $resultado = $validador->validar($crianca->fresh(), $aula, $palavra->silabas);

            expect($resultado->valida)->toBeTrue("{$palavra->palavra} (".implode('-', $palavra->silabas).") não é formável na missão {$aula->palavra_geradora}: {$resultado->tipo}");
        }

        progresso($crianca, $aula, CriancaAula::CONCLUIDA);
    }
});

it('usa só personagens originais nos textos (sem marcas de terceiros)', function () {
    $textos = Aula::with(['historiaPaginas', 'perguntas'])->get()
        ->flatMap(fn ($a) => [$a->titulo, ...$a->historiaPaginas->pluck('texto'), ...$a->perguntas->pluck('texto')])
        ->implode(' ');

    foreach (['homem-aranha', 'spider', 'marvel', 'sony', 'poppy', 'huggy', 'playtime'] as $proibido) {
        expect(mb_strtolower($textos))->not->toContain($proibido);
    }

    expect($textos)->toContain('{{heroi}}')->toContain('{{fabrica}}');
});

it('semeia 12 avatares e 9 figuras secretas', function () {
    expect(OpcaoVisual::avatares()->count())->toBe(12)
        ->and(OpcaoVisual::figuras()->count())->toBe(9);
});

it('rodar o seed de novo não duplica nem sobrescreve edição do CMS', function () {
    aulaDaPalavra('TEIA')->update(['titulo' => 'Título editado']);

    $this->seed(ConteudoInicialSeeder::class);

    expect(Aula::count())->toBe(10)
        ->and(aulaDaPalavra('TEIA')->titulo)->toBe('Título editado');
});
