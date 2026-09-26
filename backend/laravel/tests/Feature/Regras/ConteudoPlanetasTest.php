<?php

use App\Models\Aula;
use App\Models\Palavra;
use App\Services\Atividades\RegistroAtividades;
use Database\Seeders\ConteudoGeografiaSeeder;
use Database\Seeders\ConteudoHistoriaSeeder;
use Database\Seeders\ConteudoInicialSeeder;
use Database\Seeders\ConteudoMatematicaSeeder;
use Illuminate\Support\Facades\Artisan;

beforeEach(fn () => semearConteudo());

it('semeia as missões de Geografia e História com habilidade da BNCC e atividades válidas', function () {
    foreach (['geografia' => ['EF02GE', 4, 4], 'historia' => ['EF02HI', 4, 4], 'matematica' => ['EF02MA', 4, 4]] as $disciplina => [$prefixo, $total, $publicadas]) {
        $aulas = Aula::daDisciplina($disciplina)->with('atividades')->ordenadas()->get();

        expect($aulas)->toHaveCount($total)
            ->and($aulas->filter->estaPublicada())->toHaveCount($publicadas)
            ->and($aulas->first()->pre_requisito_aula_id)->toBeNull();

        foreach ($aulas as $i => $aula) {
            expect($aula->palavra_geradora)->toBeNull()
                ->and($aula->habilidade_bncc)->toStartWith($prefixo)
                ->and($aula->rotulo)->not->toBeEmpty()
                ->and($aula->atividades->count())->toBeBetween(3, 6)
                ->and($aula->atividades->first()->tipo)->toBe('historia')
                ->and($aula->atividades->filter->ehAvaliada()->count())->toBeGreaterThanOrEqual(2);

            if ($i > 0) {
                expect($aula->pre_requisito_aula_id)->toBe($aulas[$i - 1]->id);
            }

            foreach ($aula->atividades as $atividade) {
                expect(RegistroAtividades::para($atividade->tipo)->validarConfig($atividade->configArray()))->toEqual($atividade->configArray());
            }
        }
    }
});

it('nenhum texto de nenhum planeta diz "errado" nem usa marcas de terceiros', function () {
    foreach (Aula::with(['atividades', 'historiaPaginas', 'perguntas'])->get() as $aula) {
        $texto = mb_strtolower(implode(' ', [
            $aula->titulo, (string) $aula->descricao,
            ...$aula->historiaPaginas->pluck('texto'),
            ...$aula->perguntas->pluck('texto'),
            ...$aula->atividades->map(fn ($a) => json_encode($a->config, JSON_UNESCAPED_UNICODE).' '.$a->titulo.' '.$a->instrucao),
        ]));

        // "nota de 10 reais" é dinheiro, não avaliação: a proibição é a nota como conceito.
        expect($texto)->not->toMatch('/errad|incorret|ranking|\bnota\b(?! de )/', "missão {$aula->slug}");

        foreach (['homem-aranha', 'spider', 'marvel', 'sony', 'poppy', 'huggy', 'playtime', 'disney'] as $proibido) {
            expect($texto)->not->toContain($proibido);
        }
    }
});

it('as missões de Português têm 3 páginas na Fase 1, duas perguntas de compreensão e desafios de sílaba com as palavras da missão', function () {
    foreach (Aula::daDisciplina('portugues')->with(['atividades', 'historiaPaginas', 'palavras'])->get() as $aula) {
        $escolha = $aula->atividades->firstWhere('tipo', 'escolha');
        $silaba = $aula->atividades->firstWhere('tipo', 'escolher_silaba');
        $ditado = $aula->atividades->firstWhere('tipo', 'ditado');
        $palavras = $aula->palavras->pluck('palavra')->all();

        expect($aula->historiaPaginas)->toHaveCount($aula->fase === 1 ? 3 : 2)
            ->and($escolha->configArray()['itens'])->toHaveCount(2)
            ->and(count($silaba->configArray()['itens']))->toBeGreaterThanOrEqual(2)
            ->and($ditado->configArray()['itens'])->toHaveCount(2);

        foreach ($ditado->configArray()['itens'] as $item) {
            expect(in_array($item['palavra'], $palavras, true))->toBeTrue("{$item['palavra']} não é palavra da missão {$aula->slug}");
        }

        foreach ($silaba->configArray()['itens'] as $item) {
            $alvo = $item['modo'] === 'completar' ? $item['palavra'] : $item['para'];
            expect(in_array($alvo, $palavras, true) || Palavra::where('palavra', $alvo)->exists())->toBeTrue("{$alvo} não é palavra da missão {$aula->slug} nem do dicionário");
        }
    }
});

it('teia:reaplicar-conteudo lista sem --forcar e sobrescreve com --forcar', function () {
    $teia = aulaDaPalavra('TEIA');
    $teia->update(['titulo' => 'Editada no CMS']);
    $teia->atividades()->where('ordem', 2)->delete();

    Artisan::call('teia:reaplicar-conteudo', ['--slug' => ['missao-1-a-teia-do-bairro']]);

    expect(Artisan::output())->toContain('já existe')
        ->and($teia->fresh()->titulo)->toBe('Editada no CMS')
        ->and($teia->atividades()->count())->toBe(count(ConteudoInicialSeeder::SEQUENCIA) - 1);

    Artisan::call('teia:reaplicar-conteudo', ['--slug' => ['missao-1-a-teia-do-bairro'], '--forcar' => true]);

    expect(Artisan::output())->toContain('sobrescrita')
        ->and($teia->fresh()->titulo)->toBe('Missão 1: A nave Teia')
        ->and($teia->atividades()->pluck('tipo')->all())->toBe(ConteudoInicialSeeder::SEQUENCIA)
        ->and($teia->fresh()->estaPublicada())->toBeTrue()
        ->and(aulaDaPalavra('BONECA')->pre_requisito_aula_id)->toBe($teia->id);
});

it('teia:reaplicar-conteudo --todas cria o que falta sem duplicar', function () {
    Aula::where('slug', 'historia-4-trabalhos-da-comunidade')->delete();
    $antes = Aula::count();

    Artisan::call('teia:reaplicar-conteudo', ['--todas' => true]);

    $total = count(ConteudoInicialSeeder::missoes()) + count(ConteudoMatematicaSeeder::missoes()) + count(ConteudoGeografiaSeeder::missoes()) + count(ConteudoHistoriaSeeder::missoes());

    expect(Artisan::output())->toContain('historia-4-trabalhos-da-comunidade: criada')
        ->and(Aula::count())->toBe($antes + 1)->toBe($total)
        ->and(Aula::where('slug', 'historia-4-trabalhos-da-comunidade')->first()->pre_requisito_aula_id)
        ->toBe(Aula::where('slug', 'historia-3-minha-familia')->first()->id);
});
