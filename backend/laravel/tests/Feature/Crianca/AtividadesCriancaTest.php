<?php

use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Services\Aulas\AtividadesPadrao;

beforeEach(function () {
    semearConteudo();
    $this->crianca = Crianca::factory()->create();
    $this->teia = aulaDaPalavra('TEIA');
});

it('entrega a sequência de atividades montada por tipo, sem respostas', function () {
    $aula = $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->teia->id}/iniciar")->assertOk()->json();

    expect($aula['disciplina'])->toBe('portugues')
        ->and($aula['rotulo'])->toBe('TEIA')
        ->and($aula['total_atividades'])->toBe(7)
        ->and($aula['etapas'])->toBe([...AtividadesPadrao::PORTUGUES, 'conquista'])
        ->and(array_column($aula['atividades'], 'tipo'))->toBe(AtividadesPadrao::PORTUGUES)
        ->and(array_column($aula['atividades'], 'ordem'))->toBe(range(1, 7))
        ->and(array_column($aula['atividades'], 'avaliada'))->toBe([false, false, false, false, false, true, true]);

    [$historia, $conversa, $palavra, $palmas, $ficha, $criacao, $frase] = $aula['atividades'];

    expect($historia['paginas'])->toHaveCount(5)
        ->and($conversa['perguntas'])->toHaveCount(3)
        ->and($palavra['palavra'])->toBe('TEIA')
        ->and(array_column($palmas['silabas'], 'texto'))->toBe(['TEI', 'A'])
        ->and(array_column($ficha['linhas'][0]['membros'], 'texto'))->toBe(['TA', 'TE', 'TI', 'TO', 'TU'])
        ->and(array_column($criacao['pecas'], 'texto'))->toBe(array_column($aula['pecas'], 'texto'))
        ->and(array_column($criacao['metas'], 'palavra'))->toContain('TATU')
        ->and($criacao['teia_total'])->toBe(0)
        ->and($frase['palavrinhas'])->toContain('O', 'TEM')
        ->and($frase['minimo'])->toBe(2);
});

it('a última etapa concluível é a última atividade; a conquista vem depois dela', function () {
    $url = "/api/crianca/aulas/{$this->teia->id}";

    foreach (range(1, 7) as $n) {
        $this->comoCrianca($this->crianca)->postJson("{$url}/etapas/{$n}/concluir")->assertOk()->assertJsonPath('etapa_atual', $n + 1);
    }

    $this->comoCrianca($this->crianca)->postJson("{$url}/etapas/8/concluir")->assertStatus(422);
    $this->comoCrianca($this->crianca)->postJson("{$url}/concluir")->assertOk()->assertJsonPath('estrelas', 3);

    expect(CriancaAula::where('crianca_id', $this->crianca->id)->value('etapa_atual'))->toBe(8);
});

it('responder numa atividade avaliada equivale à tentativa da criação', function () {
    $url = "/api/crianca/aulas/{$this->teia->id}/atividades";

    $acerto = $this->comoCrianca($this->crianca)->postJson("{$url}/6/responder", ['silabas' => ['TA', 'TU']])
        ->assertOk()
        ->assertJsonPath('correta', true)
        ->assertJsonPath('extra.palavra', 'TATU')
        ->assertJsonPath('extra.nova_na_teia', true)
        ->assertJsonPath('xp_ganho', 1)
        ->assertJsonPath('xp_total', 1)
        ->assertJsonPath('nivel', 1)
        ->json();

    expect($acerto['extra']['conquistas'][0]['chave'])->toBe('primeira_palavra');

    $erro = $this->comoCrianca($this->crianca)->postJson("{$url}/6/responder", ['silabas' => ['TU', 'TO', 'TA']])
        ->assertOk()
        ->assertJsonPath('correta', false)
        ->assertJsonPath('xp_ganho', 0)
        ->json();

    expect($erro['dica'])->not->toBeEmpty()
        ->and(mb_strtolower($erro['mensagem'].' '.$erro['dica']))->not->toContain('errad');

    $this->comoCrianca($this->crianca)->postJson("{$url}/7/responder", ['palavras' => ['O', 'TATU']])
        ->assertOk()
        ->assertJsonPath('correta', true)
        ->assertJsonPath('extra.texto', 'O TATU');
});

it('recusa resposta em atividade que não é avaliada ou que não existe', function () {
    $url = "/api/crianca/aulas/{$this->teia->id}/atividades";

    $this->comoCrianca($this->crianca)->postJson("{$url}/1/responder", [])->assertStatus(422);
    $this->comoCrianca($this->crianca)->postJson("{$url}/9/responder", [])->assertNotFound();

    $boneca = aulaDaPalavra('BONECA');
    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$boneca->id}/atividades/6/responder", ['silabas' => ['BO', 'CA']])->assertForbidden();
});

it('mapa traz disciplina, rótulo e total de atividades, e filtra por disciplina', function () {
    $missoes = $this->comoCrianca($this->crianca)->getJson('/api/crianca/mapa')->assertOk()->json('missoes');

    expect($missoes[0]['disciplina'])->toBe('portugues')
        ->and($missoes[0]['rotulo'])->toBe('TEIA')
        ->and($missoes[0]['total_atividades'])->toBe(7);

    expect($this->comoCrianca($this->crianca)->getJson('/api/crianca/mapa?disciplina=matematica')->json('missoes'))->toBe([])
        ->and($this->comoCrianca($this->crianca)->getJson('/api/crianca/mapa?disciplina=portugues')->json('missoes'))->toHaveCount(5);
});

it('etapa_atual nunca passa da conquista quando a missão encolhe', function () {
    progresso($this->crianca, $this->teia, CriancaAula::EM_ANDAMENTO);
    CriancaAula::where('crianca_id', $this->crianca->id)->update(['etapa_atual' => 20]);

    $this->comoCrianca($this->crianca)->getJson("/api/crianca/aulas/{$this->teia->id}")
        ->assertOk()
        ->assertJsonPath('etapa_atual', 8);
});
