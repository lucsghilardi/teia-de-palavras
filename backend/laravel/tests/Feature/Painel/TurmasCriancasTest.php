<?php

use App\Models\Consentimento;
use App\Models\Crianca;
use App\Models\Turma;
use App\Models\User;
use Database\Seeders\ConfiguracoesSeeder;
use Database\Seeders\OpcoesVisuaisSeeder;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->seed([OpcoesVisuaisSeeder::class, ConfiguracoesSeeder::class]);
    $this->educador = User::factory()->create();
    $this->turma = Turma::factory()->for($this->educador, 'educador')->create();
});

function novaCrianca(array $extra = []): array
{
    return [
        'turma_id' => test()->turma->id,
        'apelido' => 'Gugu',
        'avatar_chave' => 'tigre',
        'figura_secreta_chave' => 'foguete',
        'usa_minusculas' => false,
        'consentimento' => ['aceito' => true, 'versao_texto' => 'v1'],
        ...$extra,
    ];
}

it('cria turma com código de 6 caracteres sem ambiguidade', function () {
    $codigo = $this->comoAdulto($this->educador)
        ->postJson('/api/painel/turmas', ['nome' => 'Casa'])
        ->assertCreated()
        ->assertJsonPath('nome', 'Casa')
        ->assertJsonPath('educador.id', $this->educador->id)
        ->assertJsonPath('total_criancas', 0)
        ->json('codigo');

    expect($codigo)->toMatch('/^[A-HJ-NP-Z2-9]{6}$/');
});

it('gera outro código para a turma', function () {
    $antigo = $this->turma->codigo;

    $novo = $this->comoAdulto($this->educador)
        ->postJson("/api/painel/turmas/{$this->turma->id}/novo-codigo")
        ->assertOk()
        ->json('codigo');

    expect($novo)->not->toBe($antigo);
});

it('mostra a turma com as crianças', function () {
    Crianca::factory()->for($this->turma)->create(['apelido' => 'Bia']);

    $this->comoAdulto($this->educador)->getJson("/api/painel/turmas/{$this->turma->id}")
        ->assertOk()
        ->assertJsonPath('total_criancas', 1)
        ->assertJsonPath('criancas.0.apelido', 'Bia')
        ->assertJsonPath('criancas.0.avatar.emoji', '🦊');
});

it('não apaga turma com crianças', function () {
    Crianca::factory()->for($this->turma)->create();

    $this->comoAdulto($this->educador)->deleteJson("/api/painel/turmas/{$this->turma->id}")->assertStatus(422);
});

it('cadastra criança com consentimento registrado, sem expor a figura secreta', function () {
    $resposta = $this->comoAdulto($this->educador)
        ->postJson('/api/painel/criancas', novaCrianca(), ['REMOTE_ADDR' => '10.1.2.3'])
        ->assertCreated()
        ->assertJsonPath('apelido', 'Gugu')
        ->assertJsonPath('avatar.chave', 'tigre')
        ->assertJsonPath('turma.id', $this->turma->id)
        ->assertJsonPath('responsavel.id', $this->educador->id)
        ->assertJsonPath('consentimento.versao_texto', 'v1')
        ->assertJsonMissingPath('figura_secreta_hash')
        ->assertJsonMissingPath('figura_secreta_chave');

    $crianca = Crianca::findOrFail($resposta->json('id'));
    $consentimento = Consentimento::where('crianca_id', $crianca->id)->firstOrFail();

    expect(Hash::check('foguete', $crianca->figura_secreta_hash))->toBeTrue()
        ->and($consentimento->user_id)->toBe($this->educador->id)
        ->and($consentimento->aceito_em)->not->toBeNull();
});

it('não cadastra criança sem consentimento do responsável', function () {
    $this->comoAdulto($this->educador)
        ->postJson('/api/painel/criancas', novaCrianca(['consentimento' => ['aceito' => false, 'versao_texto' => 'v1']]))
        ->assertStatus(422)
        ->assertJsonValidationErrors('consentimento.aceito');

    $this->comoAdulto($this->educador)
        ->postJson('/api/painel/criancas', novaCrianca(['consentimento' => null]))
        ->assertStatus(422);

    expect(Crianca::count())->toBe(0);
});

it('ignora dados pessoais extras (LGPD: só apelido, avatar e turma)', function () {
    $id = $this->comoAdulto($this->educador)
        ->postJson('/api/painel/criancas', novaCrianca(['nome_completo' => 'Fulano de Tal', 'email' => 'x@y.com']))
        ->assertCreated()
        ->json('id');

    expect(json_encode(Crianca::findOrFail($id)->getAttributes()))->not->toContain('Fulano')->not->toContain('x@y.com');
});

it('apelido é único na turma, mas pode repetir em outra', function () {
    Crianca::factory()->for($this->turma)->create(['apelido' => 'Gugu']);

    $this->comoAdulto($this->educador)->postJson('/api/painel/criancas', novaCrianca())
        ->assertStatus(422)
        ->assertJsonValidationErrors('apelido');

    $outra = Turma::factory()->for($this->educador, 'educador')->create();

    $this->comoAdulto($this->educador)->postJson('/api/painel/criancas', novaCrianca(['turma_id' => $outra->id]))
        ->assertCreated();
});

it('recusa avatar ou figura que não existem', function () {
    $this->comoAdulto($this->educador)
        ->postJson('/api/painel/criancas', novaCrianca(['avatar_chave' => 'dragao', 'figura_secreta_chave' => 'tigre']))
        ->assertStatus(422)
        ->assertJsonValidationErrors(['avatar_chave', 'figura_secreta_chave']);
});

it('redefine a figura secreta e desbloqueia a entrada', function () {
    $crianca = Crianca::factory()->for($this->turma)->create([
        'tentativas_login_falhas' => 5,
        'bloqueada_ate' => now()->addMinutes(10),
    ]);

    $this->comoAdulto($this->educador)
        ->postJson("/api/painel/criancas/{$crianca->id}/figura-secreta", ['figura_secreta_chave' => 'lua'])
        ->assertOk()
        ->assertJsonPath('bloqueada_ate', null);

    $crianca->refresh();
    expect(Hash::check('lua', $crianca->figura_secreta_hash))->toBeTrue()
        ->and($crianca->tentativas_login_falhas)->toBe(0);
});

it('registra pedido de exclusão e depois exclui', function () {
    $crianca = Crianca::factory()->for($this->turma)->create();

    $this->comoAdulto($this->educador)
        ->postJson("/api/painel/criancas/{$crianca->id}/solicitar-exclusao")
        ->assertOk()
        ->assertJsonPath('exclusao_solicitada_em', fn ($v) => $v !== null);

    $this->comoAdulto($this->educador)->deleteJson("/api/painel/criancas/{$crianca->id}")->assertNoContent();

    expect(Crianca::find($crianca->id))->toBeNull()
        ->and(Crianca::withTrashed()->find($crianca->id))->not->toBeNull();
});

it('filtra crianças por turma', function () {
    $outra = Turma::factory()->for($this->educador, 'educador')->create();
    Crianca::factory()->for($this->turma)->create();
    Crianca::factory()->for($outra)->create();

    $this->comoAdulto($this->educador)
        ->getJson("/api/painel/criancas?turma_id={$outra->id}")
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.turma.id', $outra->id);
});

it('entrega avatares e figuras para as grades do cadastro', function () {
    $this->comoAdulto($this->educador)->getJson('/api/painel/opcoes-visuais')
        ->assertOk()
        ->assertJsonCount(12, 'avatares')
        ->assertJsonCount(9, 'figuras')
        ->assertJsonStructure(['avatares' => [['chave', 'rotulo', 'emoji', 'imagem_url']]]);
});
