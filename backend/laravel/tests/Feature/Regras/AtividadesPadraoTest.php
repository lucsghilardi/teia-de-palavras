<?php

use App\Models\Aula;
use App\Services\Aulas\AtividadesPadrao;
use Database\Seeders\ConteudoInicialSeeder;

it('toda missão semeada de Português segue a sequência clássica (prólogo) ou a enxuta da temporada', function () {
    semearConteudo();

    $validas = [ConteudoInicialSeeder::SEQUENCIA_CLASSICA, ...array_map(ConteudoInicialSeeder::sequencia(...), ConteudoInicialSeeder::TREINOS)];

    Aula::daDisciplina('portugues')->with('atividades')->get()->each(function (Aula $aula) use ($validas) {
        $tipos = $aula->atividades->pluck('tipo')->all();

        expect(in_array($tipos, $validas, true))->toBeTrue("sequência inesperada em {$aula->slug}")
            ->and($aula->atividades->pluck('ordem')->all())->toBe(range(1, count($tipos)))
            ->and($aula->disciplina)->toBe('portugues');
    });

    $tipos = fn (string $slug) => Aula::where('slug', $slug)->first()->atividades()->pluck('tipo')->all();

    // Prólogo clássico (8 etapas); a Temporada 1 começa enxuta (6 etapas, um treino).
    expect($tipos('missao-1-a-teia-do-bairro'))->toBe(ConteudoInicialSeeder::SEQUENCIA_CLASSICA)
        ->and($tipos('missao-2-a-boneca-perdida'))->toBe(ConteudoInicialSeeder::SEQUENCIA_CLASSICA)
        ->and($tipos('missao-3-o-pulo-certeiro'))->toBe(['historia', 'palavra', 'ficha', 'montar_palavras', 'escolher_silaba', 'frase']);
});

it('garantir() cria a sequência padrão uma única vez e deixa outras disciplinas vazias', function () {
    $portugues = Aula::create(['slug' => 'p', 'titulo' => 'P', 'palavra_geradora' => 'TEIA']);
    AtividadesPadrao::garantir($portugues);
    AtividadesPadrao::garantir($portugues);

    $matematica = Aula::create(['slug' => 'm', 'titulo' => 'M', 'disciplina' => 'matematica']);
    AtividadesPadrao::garantir($matematica);

    expect($portugues->atividades()->count())->toBe(count(AtividadesPadrao::PORTUGUES))
        ->and($portugues->atividades()->pluck('tipo')->all())->not->toContain('palmas')
        ->and($matematica->atividades()->count())->toBe(0)
        ->and($matematica->palavra_geradora)->toBeNull()
        ->and($matematica->totalAtividades())->toBe(0);
});

it('a migration preenche aulas antigas de Português sem atividades (idempotente)', function () {
    $aula = Aula::create(['slug' => 'antiga', 'titulo' => 'Antiga', 'palavra_geradora' => 'MOLA']);
    $outra = Aula::create(['slug' => 'geo', 'titulo' => 'Geo', 'disciplina' => 'geografia']);

    $migration = require database_path('migrations/2026_09_27_100000_add_disciplina_e_atividades.php');
    $migration->preencherAtividadesLegadas();
    $migration->preencherAtividadesLegadas();

    expect($aula->atividades()->pluck('tipo')->all())->toBe(AtividadesPadrao::PORTUGUES_LEGADA)
        ->and($outra->atividades()->count())->toBe(0);
});

it('ordena o mapa por disciplina (na ordem dos planetas), fase e ordem', function () {
    Aula::create(['slug' => 'h1', 'titulo' => 'H1', 'disciplina' => 'historia', 'fase' => 1, 'ordem' => 1]);
    Aula::create(['slug' => 'm1', 'titulo' => 'M1', 'disciplina' => 'matematica', 'fase' => 1, 'ordem' => 1]);
    Aula::create(['slug' => 'p2', 'titulo' => 'P2', 'palavra_geradora' => 'LUA', 'fase' => 2, 'ordem' => 1]);
    Aula::create(['slug' => 'p1', 'titulo' => 'P1', 'palavra_geradora' => 'TEIA', 'fase' => 1, 'ordem' => 2]);

    expect(Aula::ordenadas()->pluck('slug')->all())->toBe(['p1', 'p2', 'm1', 'h1'])
        ->and(Aula::daDisciplina('matematica')->pluck('slug')->all())->toBe(['m1']);
});

it('o rótulo do mapa cai para a palavra geradora e depois para o título', function () {
    $comRotulo = Aula::create(['slug' => 'a', 'titulo' => 'Somar', 'disciplina' => 'matematica', 'rotulo' => '7 + 5']);
    $palavra = Aula::create(['slug' => 'b', 'titulo' => 'Missão TEIA', 'palavra_geradora' => 'TEIA']);
    $titulo = Aula::create(['slug' => 'c', 'titulo' => 'Meu bairro', 'disciplina' => 'geografia']);

    expect($comRotulo->rotuloExibido())->toBe('7 + 5')
        ->and($palavra->rotuloExibido())->toBe('TEIA')
        ->and($titulo->rotuloExibido())->toBe('Meu bairro');
});
