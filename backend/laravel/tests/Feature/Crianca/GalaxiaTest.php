<?php

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\CriancaItem;

beforeEach(function () {
    semearConteudo();
    $this->crianca = Crianca::factory()->create();
});

it('mostra os quatro planetas na ordem, com progresso e a próxima missão de cada um', function () {
    $json = $this->comoCrianca($this->crianca)->getJson('/api/crianca/galaxia')->assertOk()->json();

    expect(collect($json['planetas'])->pluck('chave')->all())->toBe(['portugues', 'matematica', 'geografia', 'historia'])
        ->and($json['planetas'][0])->toMatchArray(['nome' => 'Português', 'icone' => 'book-open', 'publicadas' => 5, 'concluidas' => 0, 'em_andamento' => 0])
        ->and($json['planetas'][0]['proxima']['rotulo'])->toBe('TEIA')
        ->and($json['planetas'][0]['proxima']['status'])->toBe('disponivel')
        ->and($json['planetas'][1]['proxima']['rotulo'])->toBe('7 + 5')
        ->and($json['planetas'][2])->toMatchArray(['publicadas' => 0, 'proxima' => null])
        ->and($json['planetas'][0])->not->toHaveKey('jogado_em')
        ->and($json['revisao']['devidos'])->toBe(0)
        ->and($json['amigos']['novas'])->toBe(0);
});

it('as escolhas do dia trazem uma missão por planeta, o planeta parado há mais tempo primeiro', function () {
    $json = $this->comoCrianca($this->crianca)->getJson('/api/crianca/galaxia')->assertOk()->json();

    // Nunca jogou nada: ordem dos planetas.
    expect(collect($json['escolhas_do_dia'])->pluck('rotulo')->all())->toBe(['TEIA', '7 + 5']);

    // Jogou Português agora: Matemática (nunca jogada) passa na frente.
    $this->comoCrianca($this->crianca)->postJson('/api/crianca/aulas/'.aulaDaPalavra('TEIA')->id.'/iniciar')->assertOk();

    $json = $this->comoCrianca($this->crianca)->getJson('/api/crianca/galaxia')->assertOk()->json();

    expect(collect($json['escolhas_do_dia'])->pluck('rotulo')->all())->toBe(['7 + 5', 'TEIA'])
        ->and($json['escolhas_do_dia'][1]['status'])->toBe('em_andamento')
        ->and($json['planetas'][0]['em_andamento'])->toBe(1);
});

it('a próxima missão do planeta é a em andamento, senão a primeira disponível', function () {
    $teia = aulaDaPalavra('TEIA');
    progresso($this->crianca, $teia, CriancaAula::CONCLUIDA);

    $json = $this->comoCrianca($this->crianca)->getJson('/api/crianca/galaxia')->assertOk()->json();

    expect($json['planetas'][0]['concluidas'])->toBe(1)
        ->and($json['planetas'][0]['proxima']['rotulo'])->toBe('BONECA')
        ->and($json['planetas'][0]['proxima']['status'])->toBe('disponivel');

    $matematica = Aula::where('slug', 'matematica-1-somar-para-decolar')->firstOrFail();
    progresso($this->crianca, $matematica, CriancaAula::CONCLUIDA);

    $json = $this->comoCrianca($this->crianca)->getJson('/api/crianca/galaxia')->assertOk()->json();

    expect($json['planetas'][1])->toMatchArray(['concluidas' => 1, 'proxima' => null])
        ->and(collect($json['escolhas_do_dia'])->pluck('rotulo')->all())->toBe(['BONECA']);
});

it('conta os itens de revisão vencidos', function () {
    CriancaItem::create(['crianca_id' => $this->crianca->id, 'disciplina' => 'matematica', 'chave' => 'fato:1+1', 'dados' => ['tipo' => 'somar_subtrair', 'config' => ['itens' => [['a' => 1, 'b' => 1, 'operacao' => '+']]]], 'proxima_revisao_em' => today()]);

    $this->comoCrianca($this->crianca)->getJson('/api/crianca/galaxia')->assertOk()->assertJsonPath('revisao.devidos', 1);
});

it('/eu diz se a narração automática está ligada e o texto é como escrito por padrão', function () {
    $this->comoCrianca($this->crianca)->getJson('/api/crianca/eu')
        ->assertOk()
        ->assertJsonPath('narracao_automatica', true)
        ->assertJsonPath('usa_minusculas', true)
        ->assertJsonPath('avatar.icone', 'rocket')
        ->assertJsonPath('avatar.cor', '#22d3ee');
});
