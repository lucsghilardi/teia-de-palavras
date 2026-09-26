<?php

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaResposta;
use App\Models\Evento;
use App\Models\User;
use App\Services\Aulas\AulaEditorService;

beforeEach(function () {
    semearConteudo();
    $this->crianca = Crianca::factory()->create();
    $this->aula = Aula::where('slug', 'matematica-1-somar-para-decolar')->firstOrFail();
});

/** Abre a missão e devolve a atividade montada de ordem $ordem. */
function atividadeMontada(Crianca $crianca, Aula $aula, int $ordem): array
{
    $json = test()->comoCrianca($crianca)->postJson("/api/crianca/aulas/{$aula->id}/iniciar")->assertOk()->json();

    return $json['atividades'][$ordem - 1];
}

it('dá dica no primeiro erro, a resposta no segundo, e XP só no primeiro acerto', function () {
    $escolha = atividadeMontada($this->crianca, $this->aula, 5);
    $item = $escolha['itens'][0];
    $errada = collect($item['opcoes'])->firstWhere('texto', '12')['id'];
    $certa = collect($item['opcoes'])->firstWhere('texto', '14')['id'];
    $url = "/api/crianca/aulas/{$this->aula->id}/atividades/5/responder";

    $primeiro = $this->comoCrianca($this->crianca)->postJson($url, ['item' => $item['id'], 'opcao' => $errada])
        ->assertOk()
        ->assertJsonPath('correta', false)
        ->assertJsonPath('tentativas', 1)
        ->assertJsonPath('resolvido', false)
        ->assertJsonPath('revisao_agendada', false)
        ->assertJsonPath('resposta_correta', null)
        ->assertJsonPath('xp_ganho', 0)
        ->json();

    expect($primeiro['dica'])->toBe('Some 8 com 6.')
        ->and(mb_strtolower($primeiro['mensagem']))->not->toContain('errad');

    $segundo = $this->comoCrianca($this->crianca)->postJson($url, ['item' => $item['id'], 'opcao' => $errada])
        ->assertOk()
        ->assertJsonPath('correta', false)
        ->assertJsonPath('tentativas', 2)
        ->assertJsonPath('resolvido', true)
        ->assertJsonPath('revisao_agendada', true)
        ->assertJsonPath('resposta_correta.texto', '14')
        ->json();

    expect($segundo['resposta_correta']['opcao'])->toBe($certa);

    // Acertar depois de ver a resposta ainda conta como acerto (e dá o XP uma vez).
    $this->comoCrianca($this->crianca)->postJson($url, ['item' => $item['id'], 'opcao' => $certa])
        ->assertOk()
        ->assertJsonPath('correta', true)
        ->assertJsonPath('xp_ganho', 1)
        ->assertJsonPath('xp_total', 1);

    $this->comoCrianca($this->crianca)->postJson($url, ['item' => $item['id'], 'opcao' => $certa])
        ->assertOk()
        ->assertJsonPath('xp_ganho', 0)
        ->assertJsonPath('xp_total', 1);

    $linha = CriancaResposta::where('crianca_id', $this->crianca->id)->where('item', $item['id'])->first();

    expect($linha->tentativas)->toBe(4)
        ->and($linha->acertou)->toBeTrue()
        ->and($linha->acertou_na_primeira)->toBeFalse()
        ->and(Evento::where('tipo', 'resposta_certa')->count())->toBe(2)
        ->and(Evento::where('tipo', 'resposta_errada')->count())->toBe(2);
});

it('acerto de primeira marca a linha e conta o XP por item', function () {
    $contar = atividadeMontada($this->crianca, $this->aula, 2);
    $url = "/api/crianca/aulas/{$this->aula->id}/atividades/2/responder";

    foreach ($contar['itens'] as $i => $item) {
        $this->comoCrianca($this->crianca)->postJson($url, ['item' => $item['id'], 'valor' => $item['quantidade']])
            ->assertOk()
            ->assertJsonPath('correta', true)
            ->assertJsonPath('xp_total', $i + 1);
    }

    expect(CriancaResposta::where('crianca_id', $this->crianca->id)->where('acertou_na_primeira', true)->count())->toBe(3);
});

it('os fatos gerados são estáveis para a mesma criança e conferem pelo id', function () {
    $somar = atividadeMontada($this->crianca, $this->aula, 3);
    $deNovo = atividadeMontada($this->crianca, $this->aula, 3);

    expect(array_column($somar['itens'], 'id'))->toBe(array_column($deNovo['itens'], 'id'))
        ->and($somar['itens'])->toHaveCount(4)
        ->and($somar['apoio'])->toBe('icones');

    $fato = $somar['itens'][0];

    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->aula->id}/atividades/3/responder", ['item' => $fato['id'], 'valor' => $fato['a'] + $fato['b']])
        ->assertOk()
        ->assertJsonPath('correta', true);
});

it('a missão de Matemática inteira pode ser concluída pelas rotas genéricas', function () {
    $aula = $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->aula->id}/iniciar")->assertOk()->json();

    expect($aula['disciplina'])->toBe('matematica')
        ->and($aula['rotulo'])->toBe('7 + 5')
        ->and($aula['palavra_geradora'])->toBeNull()
        ->and($aula['total_atividades'])->toBe(5)
        ->and($aula['atividades'][0]['paginas'])->toHaveCount(2);

    foreach (range(1, 5) as $n) {
        $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->aula->id}/etapas/{$n}/concluir")->assertOk();
    }

    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->aula->id}/concluir")
        ->assertOk()
        ->assertJsonPath('estrelas', 3)
        ->assertJsonPath('palavras_da_missao', []);
});

it('mensagens e dicas de toda atividade semeada nunca dizem "errado"', function () {
    foreach (Aula::daDisciplina('matematica')->with('atividades')->get() as $aula) {
        foreach ($aula->atividades as $atividade) {
            $texto = json_encode($atividade->config, JSON_UNESCAPED_UNICODE).' '.$atividade->titulo.' '.$atividade->instrucao;
            expect(mb_strtolower($texto))->not->toMatch('/errad|incorret/');
        }
    }
});

it('o editor recusa config inválido nos tipos genéricos com o caminho do campo', function () {
    $educador = User::factory()->create();
    $aula = $this->comoAdulto($educador)->postJson('/api/painel/aulas', ['titulo' => 'Contas', 'fase' => 1, 'disciplina' => 'matematica'])->assertCreated()->json();

    $this->comoAdulto($educador)->putJson("/api/painel/aulas/{$aula['id']}", [
        'titulo' => 'Contas', 'fase' => 1, 'pre_requisito_aula_id' => null,
        'atividades' => [['tipo' => 'escolha', 'config' => ['itens' => [['pergunta' => 'x', 'opcoes' => ['a'], 'correta' => 0]]]]],
    ])->assertStatus(422)->assertJsonValidationErrors('atividades.0.itens.0.opcoes');

    app(AulaEditorService::class); // só para garantir que o container resolve o serviço
});
