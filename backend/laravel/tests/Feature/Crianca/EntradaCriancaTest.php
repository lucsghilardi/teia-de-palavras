<?php

use App\Models\Crianca;
use App\Models\Turma;
use App\Models\User;
use Database\Seeders\OpcoesVisuaisSeeder;

beforeEach(function () {
    $this->seed(OpcoesVisuaisSeeder::class);
    $this->turma = Turma::factory()->create(['codigo' => 'ABC234']);
    $this->crianca = Crianca::factory()->for($this->turma)->create(['apelido' => 'Gugu', 'avatar_chave' => 'robo']);
});

function entrarComo(Crianca $crianca, string $figura, string $codigo = 'ABC234')
{
    return test()->postJson('/api/crianca/login', [
        'codigo_turma' => $codigo,
        'crianca_id' => $crianca->id,
        'figura_chave' => $figura,
    ]);
}

it('mostra as crianças e as 9 figuras da turma pelo código', function () {
    Crianca::factory()->for($this->turma)->create(['apelido' => 'Ana']);

    $this->getJson('/api/crianca/turma/abc-234')
        ->assertOk()
        ->assertJsonPath('turma.codigo', 'ABC234')
        ->assertJsonPath('criancas.0.apelido', 'Ana')
        ->assertJsonPath('criancas.1.avatar.icone', 'bot')
        ->assertJsonCount(9, 'figuras')
        ->assertJsonMissingPath('criancas.0.figura_secreta_hash');
});

it('não encontra turma inativa ou inexistente', function () {
    $this->turma->update(['ativa' => false]);

    $this->getJson('/api/crianca/turma/ABC234')->assertNotFound()->assertJsonStructure(['message']);
    $this->getJson('/api/crianca/turma/ZZZZZZ')->assertNotFound();
});

it('entra com a figura secreta certa e recebe token de 8 horas', function () {
    $token = entrarComo($this->crianca, 'estrela')
        ->assertOk()
        ->assertJsonPath('expires_in', 480 * 60)
        ->json('access_token');

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/crianca/eu')
        ->assertOk()
        ->assertJsonPath('apelido', 'Gugu')
        ->assertJsonPath('avatar.chave', 'robo')
        ->assertJsonPath('estrelas', 0)
        ->assertJsonPath('config.minutos_pausa', 20);
});

it('figura errada recebe mensagem gentil e conta tentativas', function () {
    $resposta = entrarComo($this->crianca, 'lua')
        ->assertStatus(422)
        ->assertJsonPath('tentativas_restantes', 4);

    expect(mb_strtolower($resposta->json('message')))->not->toContain('errad');
});

it('bloqueia 15 minutos depois de 5 erros e o educador pode destravar', function () {
    foreach (range(1, 4) as $i) {
        entrarComo($this->crianca, 'lua')->assertStatus(422);
    }

    entrarComo($this->crianca, 'lua')->assertStatus(423)->assertJsonStructure(['message', 'bloqueada_ate']);

    // Bloqueada: nem a figura certa entra (o throttle por minuto também segura).
    $this->travel(2)->minutes();
    entrarComo($this->crianca, 'estrela')->assertStatus(423);

    $this->travel(15)->minutes();
    entrarComo($this->crianca, 'estrela')->assertOk();
});

it('não entra com o código de outra turma', function () {
    Turma::factory()->create(['codigo' => 'XYZ789']);

    entrarComo($this->crianca, 'estrela', 'XYZ789')->assertNotFound();
});

it('criança excluída não entra nem usa token antigo', function () {
    $token = entrarComo($this->crianca, 'estrela')->json('access_token');
    $this->crianca->delete();

    $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/crianca/eu')->assertUnauthorized();
    entrarComo($this->crianca, 'estrela')->assertNotFound();
});

it('turma pausada derruba a sessão da criança', function () {
    $token = entrarComo($this->crianca, 'estrela')->json('access_token');
    $this->turma->update(['ativa' => false]);

    $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/crianca/mapa')->assertUnauthorized();
});

it('token de adulto não serve no app da criança, nem o contrário', function () {
    $adulto = User::factory()->create();

    $this->comoAdulto($adulto)->getJson('/api/crianca/eu')->assertUnauthorized();
    $this->comoCrianca($this->crianca)->getJson('/api/painel/turmas')->assertUnauthorized();
});

it('renova o token da criança e recusa token de adulto no refresh', function () {
    $token = entrarComo($this->crianca, 'estrela')->json('access_token');

    $novo = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/crianca/refresh')
        ->assertOk()
        ->json('access_token');

    $this->withHeader('Authorization', "Bearer {$novo}")->getJson('/api/crianca/eu')->assertOk();

    $this->comoAdulto(User::factory()->create())->postJson('/api/crianca/refresh')->assertUnauthorized();
});

it('sair invalida o token', function () {
    $token = entrarComo($this->crianca, 'estrela')->json('access_token');

    $this->withHeader('Authorization', "Bearer {$token}")->postJson('/api/crianca/sair')->assertOk();
    $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/crianca/eu')->assertUnauthorized();
});

it('o teto de tentativas responde em português e com gentileza', function () {
    foreach (range(1, 5) as $i) {
        entrarComo($this->crianca, 'lua');
    }

    // Depois do bloqueio de 15 min, 5 entradas certas no mesmo minuto passam;
    // a sexta esbarra no teto por minuto.
    $this->travel(20)->minutes();
    foreach (range(1, 5) as $i) {
        entrarComo($this->crianca, 'estrela');
    }

    $resposta = entrarComo($this->crianca, 'estrela')->assertStatus(429);

    expect($resposta->json('message'))->toBe('Vamos esperar um pouquinho? Depois a gente tenta de novo.');
});
