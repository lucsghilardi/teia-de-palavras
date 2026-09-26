<?php

use App\Models\Crianca;
use App\Models\Turma;
use App\Models\User;
use Database\Seeders\OpcoesVisuaisSeeder;

beforeEach(function () {
    $this->seed(OpcoesVisuaisSeeder::class);
    $this->admin = User::factory()->admin()->create();
    $this->ana = User::factory()->create(['name' => 'Ana']);
    $this->beto = User::factory()->create(['name' => 'Beto']);
    $this->turmaDaAna = Turma::factory()->for($this->ana, 'educador')->create();
    $this->turmaDoBeto = Turma::factory()->for($this->beto, 'educador')->create();
    $this->criancaDaAna = Crianca::factory()->for($this->turmaDaAna)->create();
    $this->criancaDoBeto = Crianca::factory()->for($this->turmaDoBeto)->create();
});

it('sem token nada do painel responde', function () {
    $this->getJson('/api/painel/turmas')->assertUnauthorized();
    $this->getJson('/api/painel/aulas')->assertUnauthorized();
});

it('token de criança não abre o painel (guards separados)', function () {
    $token = auth('crianca')->login($this->criancaDaAna);

    $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/painel/turmas')->assertUnauthorized();
    $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/me')->assertUnauthorized();
});

it('educador lista só as próprias turmas; admin vê todas', function () {
    $this->comoAdulto($this->ana)->getJson('/api/painel/turmas')
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.id', $this->turmaDaAna->id);

    $this->comoAdulto($this->admin)->getJson('/api/painel/turmas')->assertOk()->assertJsonCount(2);
});

it('educador não abre, edita nem apaga turma de outro educador', function () {
    $id = $this->turmaDoBeto->id;

    $this->comoAdulto($this->ana)->getJson("/api/painel/turmas/{$id}")->assertForbidden();
    $this->comoAdulto($this->ana)->putJson("/api/painel/turmas/{$id}", ['nome' => 'Minha', 'ativa' => true])->assertForbidden();
    $this->comoAdulto($this->ana)->postJson("/api/painel/turmas/{$id}/novo-codigo")->assertForbidden();
    $this->comoAdulto($this->ana)->deleteJson("/api/painel/turmas/{$id}")->assertForbidden();
});

it('educador lista só as crianças das próprias turmas', function () {
    $this->comoAdulto($this->ana)->getJson('/api/painel/criancas')
        ->assertOk()
        ->assertJsonCount(1)
        ->assertJsonPath('0.id', $this->criancaDaAna->id);

    $this->comoAdulto($this->admin)->getJson('/api/painel/criancas')->assertOk()->assertJsonCount(2);
});

it('educador não vê nem mexe em criança de outra turma', function () {
    $id = $this->criancaDoBeto->id;

    $this->comoAdulto($this->ana)->getJson("/api/painel/criancas/{$id}")->assertForbidden();
    $this->comoAdulto($this->ana)->postJson("/api/painel/criancas/{$id}/figura-secreta", ['figura_secreta_chave' => 'lua'])->assertForbidden();
    $this->comoAdulto($this->ana)->postJson("/api/painel/criancas/{$id}/solicitar-exclusao")->assertForbidden();
    $this->comoAdulto($this->ana)->deleteJson("/api/painel/criancas/{$id}")->assertForbidden();
});

it('educador não cadastra criança em turma alheia nem move a sua para lá', function () {
    $this->comoAdulto($this->ana)->postJson('/api/painel/criancas', [
        'turma_id' => $this->turmaDoBeto->id,
        'apelido' => 'Intrusa',
        'avatar_chave' => 'satelite',
        'figura_secreta_chave' => 'sol',
        'consentimento' => ['aceito' => true, 'versao_texto' => 'v1'],
    ])->assertForbidden();

    $this->comoAdulto($this->ana)->putJson("/api/painel/criancas/{$this->criancaDaAna->id}", [
        'turma_id' => $this->turmaDoBeto->id,
        'apelido' => $this->criancaDaAna->apelido,
        'avatar_chave' => 'nave',
    ])->assertForbidden();
});

it('usuários do painel continuam só para admin', function () {
    $this->comoAdulto($this->ana)->getJson('/api/painel/users')->assertForbidden();
    $this->comoAdulto($this->admin)->getJson('/api/painel/users')->assertOk();
});

it('conteúdo é compartilhado: qualquer educador lê e cria aulas', function () {
    $this->comoAdulto($this->ana)->getJson('/api/painel/aulas')->assertOk();
    $this->comoAdulto($this->ana)->postJson('/api/painel/aulas', [
        'titulo' => 'Missão da Ana', 'palavra_geradora' => 'SAPO', 'fase' => 1,
    ])->assertCreated();
});

it('só o autor ou o admin apagam uma aula', function () {
    $id = $this->comoAdulto($this->ana)->postJson('/api/painel/aulas', [
        'titulo' => 'Missão da Ana', 'palavra_geradora' => 'SAPO', 'fase' => 1,
    ])->json('id');

    $this->comoAdulto($this->beto)->deleteJson("/api/painel/aulas/{$id}")->assertForbidden();
    $this->comoAdulto($this->admin)->deleteJson("/api/painel/aulas/{$id}")->assertNoContent();
});

it('educador desativado perde o acesso na hora', function () {
    $token = $this->bearerTokenFor($this->ana);
    $this->ana->update(['is_active' => false]);

    $this->withHeader('Authorization', $token)->getJson('/api/painel/turmas')->assertUnauthorized();
});
