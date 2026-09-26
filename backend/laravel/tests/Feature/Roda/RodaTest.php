<?php

use App\Events\DuplaAtualizada;
use App\Events\RodaAtualizada;
use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\CriancaEstatistica;
use App\Models\TeiaPalavra;
use App\Models\Turma;
use App\Models\TurmaSessao;
use App\Models\User;
use Illuminate\Support\Facades\Event;

/*
| A Roda: o educador abre e conduz uma missão ao vivo; as crianças entram e
| seguem o líder. Snapshots vão pelo Reverb (aqui, Event::fake).
*/

beforeEach(function () {
    semearConteudo();
    Event::fake([RodaAtualizada::class, DuplaAtualizada::class]);

    $this->educador = User::factory()->create();
    $this->turma = Turma::factory()->for($this->educador, 'educador')->create(['nome' => 'Casa A']);
    $this->ana = Crianca::factory()->for($this->turma)->create(['apelido' => 'Ana']);
    $this->beto = Crianca::factory()->for($this->turma)->create(['apelido' => 'Beto']);
    $this->caio = Crianca::factory()->for($this->turma)->create(['apelido' => 'Caio']);
    $this->teia = aulaDaPalavra('TEIA');
});

function abrirRoda(User $educador, Turma $turma, Aula $aula): array
{
    return test()->comoAdulto($educador)->postJson('/api/painel/rodas', ['turma_id' => $turma->id, 'aula_id' => $aula->id])->assertCreated()->json();
}

function comandar(User $educador, int $rodaId, string $acao, ?int $valor = null): array
{
    return test()->comoAdulto($educador)->postJson("/api/painel/rodas/{$rodaId}/comandos", array_filter(['acao' => $acao, 'valor' => $valor], fn ($v) => $v !== null))->assertOk()->json();
}

it('o educador abre uma roda (uma por turma, só missão publicada, só nas suas turmas)', function () {
    $roda = abrirRoda($this->educador, $this->turma, $this->teia);

    expect($roda)->toMatchArray(['status' => 'aguardando', 'etapa_atual' => 1, 'total_etapas' => 9, 'participantes' => [], 'duplas' => []])
        ->and($roda['codigo'])->toMatch('/^[A-HJKMNP-Z2-9]{6}$/')
        ->and($roda['aula'])->toMatchArray(['rotulo' => 'TEIA', 'disciplina' => 'portugues', 'total_atividades' => 8])
        ->and($roda['turma']['nome'])->toBe('Casa A')
        ->and($roda['estado'])->toBe(['pagina' => 0, 'item' => 0]);

    $this->comoAdulto($this->educador)->postJson('/api/painel/rodas', ['turma_id' => $this->turma->id, 'aula_id' => $this->teia->id])
        ->assertUnprocessable()->assertJsonPath('roda_id', $roda['id']);

    $rascunho = Aula::where('status', 'rascunho')->firstOrFail();
    $outraTurma = Turma::factory()->for($this->educador, 'educador')->create();
    $this->comoAdulto($this->educador)->postJson('/api/painel/rodas', ['turma_id' => $outraTurma->id, 'aula_id' => $rascunho->id])->assertUnprocessable();

    $this->comoAdulto(User::factory()->create())->postJson('/api/painel/rodas', ['turma_id' => $this->turma->id, 'aula_id' => $this->teia->id])->assertForbidden();
    $this->comoAdulto(User::factory()->create())->getJson("/api/painel/rodas/{$roda['id']}")->assertForbidden();

    $this->comoAdulto($this->educador)->getJson('/api/painel/rodas')->assertOk()->assertJsonCount(1)->assertJsonPath('0.id', $roda['id']);

    $painel = $this->comoAdulto($this->educador)->getJson("/api/painel/rodas/{$roda['id']}")->assertOk()->json();
    expect($painel['conteudo']['atividades'])->toHaveCount(8)
        ->and(collect($painel['conteudo']['atividades'])->firstWhere('tipo', 'montar_palavras')['pecas'])->not->toBeEmpty()
        ->and($painel['criancas_da_turma'])->toHaveCount(3)
        ->and($painel['duplas'])->toBe([]);
});

it('as crianças da turma entram (sem código ou pelo código), recebem o pacote e quem não entrou leva 403', function () {
    $roda = abrirRoda($this->educador, $this->turma, $this->teia);

    $this->comoCrianca($this->ana)->getJson('/api/crianca/roda')->assertOk()->assertJsonPath('roda.id', $roda['id'])->assertJsonPath('roda.aula.rotulo', 'TEIA');

    $pacote = $this->comoCrianca($this->ana)->postJson('/api/crianca/rodas/entrar', [])->assertOk()->json();
    expect($pacote['eu'])->toBe($this->ana->id)
        ->and($pacote['dupla'])->toBeNull()
        ->and(collect($pacote['roda']['participantes'])->pluck('apelido')->all())->toBe(['Ana'])
        ->and($pacote['roda']['participantes'][0]['presente'])->toBeTrue()
        ->and($pacote['conteudo']['atividades'])->toHaveCount(8)
        ->and(collect($pacote['conteudo']['atividades'])->firstWhere('tipo', 'montar_palavras')['pecas'])->not->toBeEmpty();

    $this->comoCrianca($this->beto)->postJson('/api/crianca/rodas/entrar', ['codigo' => strtolower($roda['codigo'])])->assertOk()->assertJsonCount(2, 'roda.participantes');
    $this->comoCrianca($this->caio)->getJson("/api/crianca/rodas/{$roda['id']}")->assertForbidden();
    $this->comoCrianca($this->caio)->postJson("/api/crianca/rodas/{$roda['id']}/tentativas", ['silabas' => ['TA', 'TU']])->assertForbidden();
    $this->comoCrianca($this->ana)->postJson('/api/crianca/rodas/entrar', ['codigo' => 'NAOTEM'])->assertNotFound();

    // Sair e voltar: continua na lista, marcada como ausente e depois presente de novo.
    $this->comoCrianca($this->beto)->postJson("/api/crianca/rodas/{$roda['id']}/sair")->assertOk();
    expect(collect($this->comoCrianca($this->ana)->getJson("/api/crianca/rodas/{$roda['id']}")->json('roda.participantes'))->firstWhere('apelido', 'Beto')['presente'])->toBeFalse();
    $this->comoCrianca($this->beto)->postJson('/api/crianca/rodas/entrar', [])->assertOk();
    expect(collect($this->comoCrianca($this->ana)->getJson("/api/crianca/rodas/{$roda['id']}")->json('roda.participantes'))->firstWhere('apelido', 'Beto')['presente'])->toBeTrue();

    Event::assertDispatched(RodaAtualizada::class, fn (RodaAtualizada $e) => $e->rodaId === $roda['id'] && count($e->estado['participantes']) >= 1);
});

it('o educador conduz (iniciar, avançar, ir_etapa, página, voltar) e encerrar conclui a missão para quem participou', function () {
    $roda = abrirRoda($this->educador, $this->turma, $this->teia);
    $this->comoCrianca($this->ana)->postJson('/api/crianca/rodas/entrar', [])->assertOk();
    $this->comoCrianca($this->beto)->postJson('/api/crianca/rodas/entrar', [])->assertOk();

    expect(comandar($this->educador, $roda['id'], 'iniciar'))->toMatchArray(['status' => 'em_andamento', 'etapa_atual' => 1])
        ->and(comandar($this->educador, $roda['id'], 'avancar')['etapa_atual'])->toBe(2)
        ->and(comandar($this->educador, $roda['id'], 'ir_etapa', 5)['etapa_atual'])->toBe(5)
        ->and(comandar($this->educador, $roda['id'], 'pagina', 2)['estado'])->toBe(['pagina' => 2, 'item' => 0])
        ->and(comandar($this->educador, $roda['id'], 'item', 1)['estado'])->toBe(['pagina' => 2, 'item' => 1])
        ->and(comandar($this->educador, $roda['id'], 'voltar'))->toMatchArray(['etapa_atual' => 4, 'estado' => ['pagina' => 0, 'item' => 0]])
        ->and(comandar($this->educador, $roda['id'], 'ir_etapa', 99)['etapa_atual'])->toBe(9)
        ->and(comandar($this->educador, $roda['id'], 'voltar')['etapa_atual'])->toBe(8);

    $this->comoAdulto($this->educador)->postJson("/api/painel/rodas/{$roda['id']}/comandos", ['acao' => 'voar'])->assertUnprocessable();

    // A criança vê o snapshot novo ao recarregar.
    $this->comoCrianca($this->ana)->getJson("/api/crianca/rodas/{$roda['id']}")->assertOk()->assertJsonPath('roda.etapa_atual', 8)->assertJsonPath('conteudo.etapa_atual', 8);

    expect(comandar($this->educador, $roda['id'], 'encerrar')['status'])->toBe('encerrada');

    foreach ([$this->ana, $this->beto] as $crianca) {
        expect(CriancaAula::where('crianca_id', $crianca->id)->where('aula_id', $this->teia->id)->value('status'))->toBe(CriancaAula::CONCLUIDA)
            ->and((int) CriancaEstatistica::where('crianca_id', $crianca->id)->value('xp_total'))->toBe(3);
    }

    expect(CriancaAula::where('crianca_id', $this->caio->id)->exists())->toBeFalse()
        ->and(TurmaSessao::find($roda['id'])->encerrada_em)->not->toBeNull();

    $this->comoAdulto($this->educador)->postJson("/api/painel/rodas/{$roda['id']}/comandos", ['acao' => 'avancar'])->assertUnprocessable();
    $this->comoCrianca($this->ana)->getJson('/api/crianca/roda')->assertOk()->assertJsonPath('roda', null);
    $this->comoCrianca($this->ana)->postJson('/api/crianca/rodas/entrar', [])->assertNotFound();
    // A roda encerrada ainda pode ser lida por quem participou (tela final).
    $this->comoCrianca($this->ana)->getJson("/api/crianca/rodas/{$roda['id']}")->assertOk()->assertJsonPath('roda.status', 'encerrada');

    // Encerrar de novo uma missão já concluída não dá XP em dobro.
    $segunda = abrirRoda($this->educador, $this->turma, $this->teia);
    $this->comoCrianca($this->ana)->postJson('/api/crianca/rodas/entrar', [])->assertOk();
    comandar($this->educador, $segunda['id'], 'encerrar');
    expect((int) CriancaEstatistica::where('crianca_id', $this->ana->id)->value('xp_total'))->toBe(3);

    Event::assertDispatched(RodaAtualizada::class, fn (RodaAtualizada $e) => $e->estado['status'] === 'encerrada');
});

it('sem dupla, a criança forma palavras com as peças da roda, responde atividades avaliadas e faz a frase', function () {
    $roda = abrirRoda($this->educador, $this->turma, $this->teia);
    $this->comoCrianca($this->ana)->postJson('/api/crianca/rodas/entrar', [])->assertOk();
    comandar($this->educador, $roda['id'], 'ir_etapa', 5);

    $this->comoCrianca($this->ana)->postJson("/api/crianca/rodas/{$roda['id']}/tentativas", ['silabas' => ['TA', 'TU']])
        ->assertOk()->assertJsonPath('valida', true)->assertJsonPath('palavra', 'TATU')->assertJsonPath('nova_na_teia', true);
    $this->comoCrianca($this->ana)->postJson("/api/crianca/rodas/{$roda['id']}/tentativas", ['silabas' => ['ZU', 'ZA']])
        ->assertOk()->assertJsonPath('valida', false)->assertJsonPath('tipo', 'silaba_indisponivel');

    expect(TeiaPalavra::where('crianca_id', $this->ana->id)->value('origem'))->toBe('criacao');

    $this->comoCrianca($this->ana)->postJson("/api/crianca/rodas/{$roda['id']}/atividades/6/responder", ['item' => 'e1', 'silaba' => 'TU'])
        ->assertOk()->assertJsonPath('correta', true)->assertJsonPath('xp_ganho', 1);
    $this->comoCrianca($this->ana)->postJson("/api/crianca/rodas/{$roda['id']}/atividades/1/responder", ['item' => 'x'])->assertUnprocessable();

    $this->comoCrianca($this->ana)->postJson("/api/crianca/rodas/{$roda['id']}/producao", ['palavras' => ['O', 'TATU']])
        ->assertOk()->assertJsonPath('texto', 'O TATU');
    $this->comoCrianca($this->ana)->postJson("/api/crianca/rodas/{$roda['id']}/producao", ['palavras' => ['O', 'ZEBRA']])->assertUnprocessable();
});
