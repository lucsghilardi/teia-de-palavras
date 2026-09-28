<?php

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaConquista;
use App\Models\CriancaItem;
use App\Models\Evento;

beforeEach(function () {
    semearConteudo();
    $this->crianca = Crianca::factory()->create();
    $this->aula = Aula::where('slug', 'matematica-1-somar-para-decolar')->firstOrFail();
});

/** Item de revisão pronto para hoje (fato de soma), direto no banco. */
function itemDeRevisao(Crianca $crianca, string $fato, array $extra = []): CriancaItem
{
    [$a, $b] = explode('+', $fato);

    return CriancaItem::create([
        'crianca_id' => $crianca->id,
        'disciplina' => 'matematica',
        'chave' => "fato:$fato",
        'dados' => ['tipo' => 'somar_subtrair', 'config' => ['itens' => [['a' => (int) $a, 'b' => (int) $b, 'operacao' => '+']], 'apoio' => 'icones', 'opcoes' => 3]],
        'caixa' => 0,
        'proxima_revisao_em' => today(),
        ...$extra,
    ]);
}

it('o segundo erro numa atividade cria o item na caixa 0, para amanhã', function () {
    $aula = $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->aula->id}/iniciar")->assertOk()->json();
    $item = $aula['atividades'][4]['itens'][0];
    $errada = collect($item['opcoes'])->firstWhere('texto', '6')['id'];
    $url = "/api/crianca/aulas/{$this->aula->id}/atividades/5/responder";

    $this->comoCrianca($this->crianca)->postJson($url, ['item' => $item['id'], 'opcao' => $errada])->assertOk()->assertJsonPath('revisao_agendada', false);

    expect(CriancaItem::count())->toBe(0);

    $this->comoCrianca($this->crianca)->postJson($url, ['item' => $item['id'], 'opcao' => $errada])->assertOk()->assertJsonPath('revisao_agendada', true);

    $linha = CriancaItem::where('crianca_id', $this->crianca->id)->firstOrFail();

    expect($linha->chave)->toBe("escolha:{$this->aula->id}:{$item['id']}")
        ->and($linha->disciplina)->toBe('matematica')
        ->and($linha->caixa)->toBe(0)
        ->and($linha->erros)->toBe(1)
        ->and($linha->proxima_revisao_em->toDateString())->toBe(today()->addDay()->toDateString())
        ->and($linha->dados['tipo'])->toBe('escolha');

    // Hoje ainda não é dia de revisão; amanhã é.
    $this->comoCrianca($this->crianca)->getJson('/api/crianca/revisao')->assertOk()->assertJsonPath('devidos', 0)->assertJsonCount(0, 'itens');

    $this->travelTo(today()->addDay());

    $this->comoCrianca($this->crianca)->getJson('/api/crianca/revisao')->assertOk()->assertJsonPath('devidos', 1)->assertJsonPath('itens.0.atividade.tipo', 'escolha');
});

it('o acerto numa atividade já registra o item na caixa 1', function () {
    $aula = $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->aula->id}/iniciar")->assertOk()->json();
    $contar = $aula['atividades'][1]['itens'][0];

    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->aula->id}/atividades/2/responder", ['item' => $contar['id'], 'valor' => $contar['quantidade']])
        ->assertOk()->assertJsonPath('correta', true);

    $linha = CriancaItem::where('crianca_id', $this->crianca->id)->firstOrFail();

    expect($linha->chave)->toBe("contar:{$contar['quantidade']}")
        ->and($linha->caixa)->toBe(1)
        ->and($linha->acertos)->toBe(1)
        ->and($linha->proxima_revisao_em->toDateString())->toBe(today()->addDay()->toDateString());
});

it('a sessão traz no máximo 6 itens, os de caixa mais baixa primeiro, montados sem a resposta', function () {
    foreach (range(1, 8) as $n) {
        itemDeRevisao($this->crianca, "{$n}+1", ['caixa' => $n % 3]);
    }
    itemDeRevisao($this->crianca, '9+9', ['proxima_revisao_em' => today()->addDays(3), 'caixa' => 0]);

    $json = $this->comoCrianca($this->crianca)->getJson('/api/crianca/revisao')->assertOk()->json();

    expect($json['devidos'])->toBe(8)
        ->and($json['itens'])->toHaveCount(6)
        ->and(collect($json['itens'])->pluck('caixa')->all())->toBe([0, 0, 1, 1, 1, 2])
        ->and(collect($json['itens'])->pluck('atividade.ordem')->all())->toBe([1, 2, 3, 4, 5, 6]);

    $atividade = $json['itens'][0]['atividade'];

    expect($atividade['tipo'])->toBe('somar_subtrair')
        ->and($atividade['avaliada'])->toBeTrue()
        ->and($atividade['itens'])->toHaveCount(1)
        ->and($atividade['itens'][0])->toHaveKeys(['id', 'a', 'b', 'operacao', 'opcoes'])
        ->and($atividade['itens'][0])->not->toHaveKey('resultado')
        ->and(json_encode($atividade))->not->toContain('"correta"');
});

it('responder certo sobe a caixa, dá XP e some da sessão; errar mostra a resposta e volta para amanhã', function () {
    $item = itemDeRevisao($this->crianca, '7+5');
    $url = "/api/crianca/revisao/{$item->id}/responder";

    $this->comoCrianca($this->crianca)->postJson($url, ['item' => '7+5', 'valor' => 12])
        ->assertOk()
        ->assertJsonPath('correta', true)
        ->assertJsonPath('xp_ganho', 1)
        ->assertJsonPath('xp_total', 1)
        ->assertJsonPath('resolvido', true)
        ->assertJsonPath('revisao_agendada', false)
        ->assertJsonPath('caixa', 1)
        ->assertJsonPath('proxima_revisao_em', today()->addDay()->toDateString());

    expect($item->fresh()->acertos)->toBe(1)
        ->and($item->fresh()->ultimo_resultado)->toBeTrue();

    $this->comoCrianca($this->crianca)->getJson('/api/crianca/revisao')->assertOk()->assertJsonPath('devidos', 0);

    // Dois dias depois vence de novo; o erro volta para a caixa 0 e já mostra a resposta (é treino).
    $this->travelTo(today()->addDays(2));

    $erro = $this->comoCrianca($this->crianca)->postJson($url, ['item' => '7+5', 'valor' => 11])
        ->assertOk()
        ->assertJsonPath('correta', false)
        ->assertJsonPath('xp_ganho', 0)
        ->assertJsonPath('resposta_correta.valor', 12)
        ->assertJsonPath('revisao_agendada', true)
        ->assertJsonPath('caixa', 0)
        ->assertJsonPath('proxima_revisao_em', today()->addDay()->toDateString())
        ->json();

    expect(mb_strtolower($erro['mensagem'].' '.$erro['dica']))->not->toMatch('/errad|incorret/')
        ->and(Evento::where('tipo', 'revisao_certa')->count())->toBe(1)
        ->and(Evento::where('tipo', 'revisao_errada')->count())->toBe(1);
});

it('dez acertos na revisão desbloqueiam a medalha "Memória de foguete"', function () {
    $item = itemDeRevisao($this->crianca, '3+4', ['acertos' => 9, 'caixa' => 2]);

    $json = $this->comoCrianca($this->crianca)->postJson("/api/crianca/revisao/{$item->id}/responder", ['item' => '3+4', 'valor' => 7])
        ->assertOk()
        ->assertJsonPath('caixa', 3)
        ->json();

    expect(collect($json['conquistas'])->pluck('chave')->all())->toBe(['revisao_10'])
        ->and($json['conquistas'][0]['icone'])->toBe('rocket')
        ->and(CriancaConquista::where('crianca_id', $this->crianca->id)->where('chave', 'revisao_10')->exists())->toBeTrue();
});

it('não deixa responder um item de outra criança nem um inexistente', function () {
    $outra = Crianca::factory()->create(['turma_id' => $this->crianca->turma_id]);
    $item = itemDeRevisao($outra, '2+2');

    $this->comoCrianca($this->crianca)->postJson("/api/crianca/revisao/{$item->id}/responder", ['item' => '2+2', 'valor' => 4])->assertNotFound();
    $this->comoCrianca($this->crianca)->postJson('/api/crianca/revisao/999999/responder', ['item' => '2+2', 'valor' => 4])->assertNotFound();

    expect($item->fresh()->acertos)->toBe(0);
});

it('a mesma chave é um só item por criança, e crianças diferentes não se misturam', function () {
    $aula = $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->aula->id}/iniciar")->assertOk()->json();
    $fato = $aula['atividades'][2]['itens'][0];
    $url = "/api/crianca/aulas/{$this->aula->id}/atividades/3/responder";

    $this->comoCrianca($this->crianca)->postJson($url, ['item' => $fato['id'], 'valor' => $fato['a'] + $fato['b']])->assertOk();
    $this->comoCrianca($this->crianca)->postJson($url, ['item' => $fato['id'], 'valor' => $fato['a'] + $fato['b']])->assertOk();

    $outra = Crianca::factory()->create(['turma_id' => $this->crianca->turma_id]);
    $this->comoCrianca($outra)->postJson("/api/crianca/aulas/{$this->aula->id}/iniciar")->assertOk();

    expect(CriancaItem::where('chave', "fato:{$fato['id']}")->count())->toBe(1)
        ->and(CriancaItem::where('crianca_id', $this->crianca->id)->first()->caixa)->toBe(2)
        ->and(CriancaItem::where('crianca_id', $outra->id)->count())->toBe(0);
});
