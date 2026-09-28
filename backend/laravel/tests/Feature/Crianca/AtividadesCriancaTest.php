<?php

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use Database\Seeders\ConteudoInicialSeeder;

beforeEach(function () {
    semearConteudo();
    $this->crianca = Crianca::factory()->create();
    $this->teia = aulaDaPalavra('TEIA');
});

it('entrega a sequência de atividades montada por tipo, sem respostas', function () {
    $aula = $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->teia->id}/iniciar")->assertOk()->json();

    expect($aula['disciplina'])->toBe('portugues')
        ->and($aula['rotulo'])->toBe('TEIA')
        ->and($aula['total_atividades'])->toBe(8)
        ->and(array_column($aula['atividades'], 'tipo'))->toBe(ConteudoInicialSeeder::SEQUENCIA_CLASSICA)
        ->and(array_column($aula['atividades'], 'ordem'))->toBe(range(1, 8))
        ->and(array_column($aula['atividades'], 'avaliada'))->toBe([false, true, false, false, true, true, true, true]);

    [$historia, $escolha, $palavra, $ficha, $criacao, $silaba, $ditado, $frase] = $aula['atividades'];

    expect($historia['paginas'])->toHaveCount(3)
        ->and($escolha['itens'])->toHaveCount(2)
        ->and($escolha['itens'][0]['opcoes'])->toHaveCount(3)
        ->and($escolha['itens'][0])->not->toHaveKey('correta')
        ->and($palavra['palavra'])->toBe('TEIA')
        ->and($silaba['itens'])->toHaveCount(3)
        ->and($silaba['itens'][0]['pecas'])->toBe(['TA', null])
        ->and($ditado['itens'])->toHaveCount(2)
        ->and($ditado['itens'][0])->toMatchArray(['id' => 'd1', 'fala' => 'tatu', 'tamanho' => 2])
        ->and($ditado['itens'][0])->not->toHaveKey('silabas')
        ->and(array_column($ficha['linhas'][0]['membros'], 'texto'))->toBe(['TA', 'TE', 'TI', 'TO', 'TU'])
        ->and(array_column($criacao['pecas'], 'texto'))->toContain('TA', 'TE', 'TI', 'TO', 'TU')
        ->and(array_column($criacao['metas'], 'palavra'))->toContain('TATU')
        ->and($criacao['teia_total'])->toBe(0)
        ->and($frase['palavrinhas'])->toContain('O', 'TEM')
        ->and($frase['minimo'])->toBe(2);
});

it('a última etapa concluível é a última atividade; a conquista vem depois dela', function () {
    $url = "/api/crianca/aulas/{$this->teia->id}";

    foreach (range(1, 8) as $n) {
        $this->comoCrianca($this->crianca)->postJson("{$url}/etapas/{$n}/concluir")->assertOk()->assertJsonPath('etapa_atual', $n + 1);
    }

    $this->comoCrianca($this->crianca)->postJson("{$url}/etapas/9/concluir")->assertStatus(422);
    $this->comoCrianca($this->crianca)->postJson("{$url}/concluir")->assertOk()->assertJsonPath('xp_total', 3);

    expect(CriancaAula::where('crianca_id', $this->crianca->id)->value('etapa_atual'))->toBe(9);
});

it('responder numa atividade avaliada equivale à tentativa da criação', function () {
    $url = "/api/crianca/aulas/{$this->teia->id}/atividades";

    $acerto = $this->comoCrianca($this->crianca)->postJson("{$url}/5/responder", ['silabas' => ['TA', 'TU']])
        ->assertOk()
        ->assertJsonPath('correta', true)
        ->assertJsonPath('extra.palavra', 'TATU')
        ->assertJsonPath('extra.nova_na_teia', true)
        ->assertJsonPath('xp_ganho', 1)
        ->assertJsonPath('xp_total', 1)
        ->assertJsonPath('nivel', 1)
        ->json();

    expect($acerto['extra']['conquistas'][0]['chave'])->toBe('primeira_palavra');

    $erro = $this->comoCrianca($this->crianca)->postJson("{$url}/5/responder", ['silabas' => ['TU', 'TO', 'TA']])
        ->assertOk()
        ->assertJsonPath('correta', false)
        ->assertJsonPath('xp_ganho', 0)
        ->json();

    expect($erro['dica'])->not->toBeEmpty()
        ->and(mb_strtolower($erro['mensagem'].' '.$erro['dica']))->not->toContain('errad');

    $this->comoCrianca($this->crianca)->postJson("{$url}/8/responder", ['palavras' => ['O', 'TATU']])
        ->assertOk()
        ->assertJsonPath('correta', true)
        ->assertJsonPath('extra.texto', 'O TATU');

    // Ditado: ouvir TATU e montar com as peças.
    $this->comoCrianca($this->crianca)->postJson("{$url}/7/responder", ['item' => 'd1', 'silabas' => ['TA', 'TU']])
        ->assertOk()
        ->assertJsonPath('correta', true)
        ->assertJsonPath('mensagem', 'isso! tatu.');

    // Escolher sílaba (EF01LP08): completar TATU com TU.
    $this->comoCrianca($this->crianca)->postJson("{$url}/6/responder", ['item' => 'e1', 'silaba' => 'TU'])
        ->assertOk()
        ->assertJsonPath('correta', true)
        ->assertJsonPath('xp_ganho', 1);
});

it('recusa resposta em atividade que não é avaliada ou que não existe', function () {
    $url = "/api/crianca/aulas/{$this->teia->id}/atividades";

    $this->comoCrianca($this->crianca)->postJson("{$url}/1/responder", [])->assertStatus(422);
    $this->comoCrianca($this->crianca)->postJson("{$url}/9/responder", [])->assertNotFound();

    $boneca = aulaDaPalavra('BONECA');
    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$boneca->id}/atividades/5/responder", ['silabas' => ['BO', 'CA']])->assertForbidden();
});

it('mapa traz disciplina, rótulo e total de atividades, e filtra por disciplina', function () {
    $missoes = $this->comoCrianca($this->crianca)->getJson('/api/crianca/mapa')->assertOk()->json('missoes');

    expect($missoes[0]['disciplina'])->toBe('portugues')
        ->and($missoes[0]['rotulo'])->toBe('TEIA')
        ->and($missoes[0]['total_atividades'])->toBe(8);

    $matematica = $this->comoCrianca($this->crianca)->getJson('/api/crianca/mapa?disciplina=matematica')->json('missoes');

    expect(collect($matematica)->pluck('disciplina')->unique()->all())->toBe(['matematica'])
        ->and($this->comoCrianca($this->crianca)->getJson('/api/crianca/mapa?disciplina=portugues')->json('missoes'))->toHaveCount(5)
        ->and($this->comoCrianca($this->crianca)->getJson('/api/crianca/mapa?disciplina=quimica')->json('missoes'))->toHaveCount(Aula::publicadas()->count());
});

it('etapa_atual nunca passa da conquista quando a missão encolhe', function () {
    progresso($this->crianca, $this->teia, CriancaAula::EM_ANDAMENTO);
    CriancaAula::where('crianca_id', $this->crianca->id)->update(['etapa_atual' => 20]);

    $this->comoCrianca($this->crianca)->getJson("/api/crianca/aulas/{$this->teia->id}")
        ->assertOk()
        ->assertJsonPath('etapa_atual', 9);
});
