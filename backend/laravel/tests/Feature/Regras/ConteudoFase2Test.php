<?php

use App\Models\Aula;
use App\Services\Atividades\RegistroAtividades;

/*
| Fase 2 dos planetas (Matemática, Geografia, História): 4 missões novas em cada
| um, no fim da corrente (a 5ª abre depois da 4ª da Fase 1). Fecham o arco da
| Gosma, que entra para a tripulação na festa de História 8.
*/

beforeEach(fn () => semearConteudo());

const FASE_2 = [
    'matematica' => [
        'matematica-4-loja-espacial',
        'matematica-5-a-mina-de-cristais',
        'matematica-6-pacotes-de-dez',
        'matematica-7-formas-do-planeta-cubo',
        'matematica-8-o-calendario-da-nave',
    ],
    'geografia' => [
        'geografia-4-campo-e-cidade',
        'geografia-5-dia-e-noite',
        'geografia-6-chuva-sol-e-vento',
        'geografia-7-a-escola-por-dentro',
        'geografia-8-pracas-e-parques',
    ],
    'historia' => [
        'historia-4-trabalhos-da-comunidade',
        'historia-5-brincadeiras-de-ontem-e-de-hoje',
        'historia-6-casa-e-escola',
        'historia-7-quem-cuida-de-que',
        'historia-8-festa-para-a-gosma',
    ],
];

it('semeia as 12 missões da Fase 2 publicadas, com história + 3 atividades avaliadas, encadeadas depois da 4ª', function () {
    foreach (FASE_2 as $disciplina => $slugs) {
        $anterior = Aula::where('slug', $slugs[0])->firstOrFail();

        foreach (array_slice($slugs, 1) as $i => $slug) {
            $aula = Aula::where('slug', $slug)->with('atividades')->first();

            expect($aula)->not->toBeNull("{$slug} não foi semeada");
            expect($aula->disciplina)->toBe($disciplina)
                ->and($aula->estaPublicada())->toBeTrue("{$slug} não está publicada")
                ->and($aula->fase)->toBe(2)
                ->and($aula->ordem)->toBe($i + 1)
                ->and($aula->pre_requisito_aula_id)->toBe($anterior->id, "{$slug} deveria abrir depois de {$anterior->slug}")
                ->and($aula->desfecho)->not->toBeEmpty()
                ->and($aula->gancho)->not->toBeEmpty()
                ->and($aula->atividades)->toHaveCount(4)
                ->and($aula->atividades->first()->tipo)->toBe('historia')
                ->and($aula->atividades->slice(1)->every->ehAvaliada())->toBeTrue("{$slug}: depois da história só atividades avaliadas");

            $config = $aula->atividades->first()->configArray();
            expect($config['paginas'])->not->toBeEmpty();

            foreach ($aula->atividades as $atividade) {
                $config = $atividade->configArray();

                expect(RegistroAtividades::para($atividade->tipo)->validarConfig($config))->toEqual($config);

                if (in_array($atividade->tipo, ['ordenar', 'linha_do_tempo'], true)) {
                    expect($config['dica'])->not->toBeEmpty("{$slug}: ordenar sem dica");
                }

                if ($atividade->tipo === 'escolha') {
                    foreach ($config['itens'] as $item) {
                        expect($item['dica'])->not->toBeEmpty("{$slug}: escolha sem dica")
                            ->and($item['explicacao'])->not->toBeEmpty("{$slug}: escolha sem explicação");
                    }
                }
            }

            $anterior = $aula;
        }
    }
});

it('a Fase 2 de Matemática conta entre 20 e 50 na mina e agrupa em dezenas nos pacotes', function () {
    $mina = Aula::where('slug', 'matematica-5-a-mina-de-cristais')->with('atividades')->firstOrFail();
    $contar = $mina->atividades->firstWhere('tipo', 'contar')->configArray();

    expect(collect($contar['itens'])->pluck('quantidade')->every(fn ($q) => $q >= 20 && $q <= 50))->toBeTrue();

    $pacotes = Aula::where('slug', 'matematica-6-pacotes-de-dez')->with('atividades')->firstOrFail();

    expect($pacotes->atividades->pluck('tipo')->all())->toContain('parear', 'somar_subtrair')
        ->and($pacotes->atividades->firstWhere('tipo', 'somar_subtrair')->configArray()['apoio'])->toBe('reta');
});

it('a escola por dentro usa o mapa da escola', function () {
    $aula = Aula::where('slug', 'geografia-7-a-escola-por-dentro')->with('atividades')->firstOrFail();

    expect($aula->atividades->firstWhere('tipo', 'mapa_pontos')->configArray()['cenario'])->toBe('escola');
});
