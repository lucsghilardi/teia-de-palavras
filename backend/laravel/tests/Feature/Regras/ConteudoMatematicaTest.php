<?php

use App\Models\Aula;
use App\Models\Crianca;
use App\Services\Atividades\RegistroAtividades;
use Database\Seeders\ConteudoMatematicaSeeder;

beforeEach(fn () => semearConteudo());

it('semeia a missão de Matemática publicada, sem palavra geradora e com atividades válidas', function () {
    $aulas = Aula::daDisciplina('matematica')->with('atividades')->ordenadas()->get();

    expect($aulas)->toHaveCount(count(ConteudoMatematicaSeeder::missoes()));

    foreach ($aulas as $aula) {
        expect($aula->palavra_geradora)->toBeNull()
            ->and($aula->habilidade_bncc)->toStartWith('EF01MA')
            ->and($aula->atividades->count())->toBeGreaterThanOrEqual(3)
            ->and($aula->atividades->contains(fn ($a) => $a->ehAvaliada()))->toBeTrue();

        foreach ($aula->atividades as $atividade) {
            // Config gravado já normalizado: revalidar não muda nada (jsonb reordena chaves; comparação por igualdade).
            expect(RegistroAtividades::para($atividade->tipo)->validarConfig($atividade->configArray()))->toEqual($atividade->configArray());
        }
    }

    expect($aulas->first()->estaPublicada())->toBeTrue()
        ->and($aulas->first()->pre_requisito_aula_id)->toBeNull();
});

it('é idempotente', function () {
    $antes = Aula::count();
    test()->seed(ConteudoMatematicaSeeder::class);

    expect(Aula::count())->toBe($antes);
});

it('as missões publicadas aparecem no mapa encadeadas, depois das de Português', function () {
    $crianca = Crianca::factory()->create();
    $missoes = $this->comoCrianca($crianca)->getJson('/api/crianca/mapa')->json('missoes');
    $matematica = collect($missoes)->where('disciplina', 'matematica')->values();

    expect($matematica)->toHaveCount(8)
        ->and($matematica->pluck('rotulo')->all())->toBe(['4 + 3', '10, 20, 30', '10 + 4', 'R$', '20 a 50', '46 = 40 + 6', 'formas', 'semana'])
        ->and($matematica->pluck('status')->all())->toBe(['disponivel', 'bloqueada', 'bloqueada', 'bloqueada', 'bloqueada', 'bloqueada', 'bloqueada', 'bloqueada'])
        ->and(collect($missoes)->pluck('disciplina')->unique()->values()->all())->toBe(['portugues', 'matematica', 'geografia', 'historia']);
});
