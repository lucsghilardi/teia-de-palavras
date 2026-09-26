<?php

use App\Models\Configuracao;
use App\Models\Turma;
use App\Models\TurmaAmizade;
use App\Models\User;
use App\Services\Amizades\AmizadeService;
use Database\Seeders\ConfiguracoesSeeder;

/*
| Amizade entre turmas (LGPD): o responsável A gera um código de uso único; o
| responsável B aceita com o termo versionado. Qualquer lado encerra.
*/

beforeEach(function () {
    $this->seed(ConfiguracoesSeeder::class);
    $this->paiA = User::factory()->create(['name' => 'Pai A']);
    $this->paiB = User::factory()->create(['name' => 'Mãe B']);
    $this->turmaA = Turma::factory()->for($this->paiA, 'educador')->create(['nome' => 'Casa A']);
    $this->turmaB = Turma::factory()->for($this->paiB, 'educador')->create(['nome' => 'Casa B']);
});

it('o responsável A gera um código de 8 caracteres, válido por 7 dias, e só ele vê o código', function () {
    $json = $this->comoAdulto($this->paiA)->postJson('/api/painel/amizades', ['turma_id' => $this->turmaA->id])
        ->assertCreated()
        ->assertJsonPath('status', 'pendente')
        ->assertJsonPath('turma.nome', 'Casa A')
        ->assertJsonPath('turma_amiga', null)
        ->assertJsonPath('gerada_por_mim', true)
        ->json();

    expect($json['codigo'])->toMatch('/^[A-HJKMNP-Z2-9]{8}$/')
        ->and(now()->diffInDays($json['expira_em']))->toBeGreaterThanOrEqual(6);

    // A lista do lado A traz o termo e o código; o lado B não enxerga nada ainda.
    $lista = $this->comoAdulto($this->paiA)->getJson('/api/painel/amizades')->assertOk()->json();

    expect($lista['termo']['versao'])->toBe(Configuracao::valor('amizade_termo_versao'))
        ->and($lista['termo']['texto'])->toContain('responsáve')
        ->and($lista['amizades'])->toHaveCount(1)
        ->and($lista['amizades'][0]['codigo'])->toBe($json['codigo']);

    expect($this->comoAdulto($this->paiB)->getJson('/api/painel/amizades')->assertOk()->json('amizades'))->toBe([]);
});

it('educador não gera convite para turma de outro; admin gera para qualquer', function () {
    $this->comoAdulto($this->paiB)->postJson('/api/painel/amizades', ['turma_id' => $this->turmaA->id])->assertForbidden();

    $admin = User::factory()->admin()->create();
    $this->comoAdulto($admin)->postJson('/api/painel/amizades', ['turma_id' => $this->turmaA->id])->assertCreated();
});

it('o responsável B aceita com o termo e a amizade aparece aceita para os dois lados (sem o código)', function () {
    $codigo = $this->comoAdulto($this->paiA)->postJson('/api/painel/amizades', ['turma_id' => $this->turmaA->id])->json('codigo');

    $this->comoAdulto($this->paiB)->postJson('/api/painel/amizades/aceitar', [
        'turma_id' => $this->turmaB->id, 'codigo' => strtolower($codigo), 'termo_aceito' => true,
    ])
        ->assertOk()
        ->assertJsonPath('status', 'aceita')
        ->assertJsonPath('turma.nome', 'Casa B')
        ->assertJsonPath('turma_amiga.nome', 'Casa A')
        ->assertJsonPath('gerada_por_mim', false)
        ->assertJsonPath('codigo', null)
        ->assertJsonPath('termo_versao', 'v1');

    $ladoA = $this->comoAdulto($this->paiA)->getJson('/api/painel/amizades')->json('amizades.0');

    expect($ladoA)->toMatchArray(['status' => 'aceita', 'codigo' => null, 'gerada_por_mim' => true])
        ->and($ladoA['turma_amiga']['nome'])->toBe('Casa B')
        ->and(app(AmizadeService::class)->saoAmigas($this->turmaA->id, $this->turmaB->id))->toBeTrue()
        ->and(app(AmizadeService::class)->turmasAmigas($this->turmaB->id)->all())->toBe([$this->turmaA->id]);

    $amizade = TurmaAmizade::firstOrFail();
    expect($amizade->aceita_por_user_id)->toBe($this->paiB->id)
        ->and($amizade->gerada_por_user_id)->toBe($this->paiA->id);
});

it('recusa aceitar sem termo, com código inválido, já usado, vencido ou da própria turma', function () {
    $codigo = $this->comoAdulto($this->paiA)->postJson('/api/painel/amizades', ['turma_id' => $this->turmaA->id])->json('codigo');
    $aceitar = fn (array $dados) => $this->comoAdulto($this->paiB)->postJson('/api/painel/amizades/aceitar', [
        'turma_id' => $this->turmaB->id, 'codigo' => $codigo, 'termo_aceito' => true, ...$dados,
    ]);

    $aceitar(['termo_aceito' => false])->assertUnprocessable()->assertJsonValidationErrors('termo_aceito');
    $aceitar(['codigo' => 'NAOEXIST'])->assertUnprocessable()->assertJsonValidationErrors('codigo');

    // A própria turma A não pode aceitar o convite que ela gerou.
    $this->comoAdulto($this->paiA)->postJson('/api/painel/amizades/aceitar', ['turma_id' => $this->turmaA->id, 'codigo' => $codigo, 'termo_aceito' => true])
        ->assertUnprocessable()->assertJsonValidationErrors('turma_id');

    // Vencido.
    TurmaAmizade::query()->update(['expira_em' => now()->subMinute()]);
    $aceitar([])->assertUnprocessable()->assertJsonValidationErrors('codigo');
    expect($this->comoAdulto($this->paiA)->getJson('/api/painel/amizades')->json('amizades.0.status'))->toBe('vencida');

    // Válido de novo → aceita; a segunda vez o código já foi usado.
    TurmaAmizade::query()->update(['expira_em' => now()->addDay()]);
    $aceitar([])->assertOk();
    $aceitar([])->assertUnprocessable()->assertJsonValidationErrors('codigo');

    // Um novo convite entre turmas que já são amigas também é recusado.
    $outro = $this->comoAdulto($this->paiA)->postJson('/api/painel/amizades', ['turma_id' => $this->turmaA->id])->json('codigo');
    $aceitar(['codigo' => $outro])->assertUnprocessable()->assertJsonValidationErrors('codigo');
});

it('qualquer um dos lados encerra a amizade; quem não participa não pode', function () {
    $codigo = $this->comoAdulto($this->paiA)->postJson('/api/painel/amizades', ['turma_id' => $this->turmaA->id])->json('codigo');
    $id = $this->comoAdulto($this->paiB)->postJson('/api/painel/amizades/aceitar', ['turma_id' => $this->turmaB->id, 'codigo' => $codigo, 'termo_aceito' => true])->json('id');

    $intruso = User::factory()->create();
    $this->comoAdulto($intruso)->deleteJson("/api/painel/amizades/{$id}")->assertForbidden();

    $this->comoAdulto($this->paiB)->deleteJson("/api/painel/amizades/{$id}")
        ->assertOk()
        ->assertJsonPath('status', 'encerrada');

    expect(app(AmizadeService::class)->saoAmigas($this->turmaA->id, $this->turmaB->id))->toBeFalse()
        ->and(TurmaAmizade::find($id)->encerrada_em)->not->toBeNull();
});

it('o termo de amizade é editável nas configurações', function () {
    $admin = User::factory()->admin()->create();
    $atuais = $this->comoAdulto($admin)->getJson('/api/painel/configuracoes')->assertOk()->json();

    $this->comoAdulto($admin)->putJson('/api/painel/configuracoes', [
        ...$atuais, 'amizade_termo_versao' => 'v2', 'amizade_termo_texto' => 'Novo termo.',
    ])->assertOk()->assertJsonPath('amizade_termo_versao', 'v2');

    $lista = $this->comoAdulto($this->paiA)->getJson('/api/painel/amizades')->assertOk()->json('termo');

    expect($lista)->toBe(['versao' => 'v2', 'texto' => 'Novo termo.']);
});
