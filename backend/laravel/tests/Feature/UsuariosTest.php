<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->admin = User::factory()->admin()->create();
});

it('admin cria um educador', function () {
    $this->comoAdulto($this->admin)
        ->postJson('/api/painel/users', [
            'name' => 'Professora Ana',
            'email' => 'Ana@Example.com',
            'role' => 'educador',
            'password' => 'secure123',
            'password_confirmation' => 'secure123',
        ])
        ->assertCreated()
        ->assertJsonPath('name', 'Professora Ana')
        ->assertJsonPath('email', 'ana@example.com')
        ->assertJsonPath('role', 'educador')
        ->assertJsonPath('is_active', true);

    $criado = User::where('email', 'ana@example.com')->firstOrFail();
    expect(Hash::check('secure123', $criado->password))->toBeTrue();
});

it('recusa papel desconhecido', function () {
    $this->comoAdulto($this->admin)
        ->postJson('/api/painel/users', [
            'name' => 'Alguém',
            'email' => 'alguem@example.com',
            'role' => 'viewer',
            'password' => 'secure123',
            'password_confirmation' => 'secure123',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('role');
});

it('educador não lista nem cria usuários', function () {
    $educador = User::factory()->create();

    $this->comoAdulto($educador)->getJson('/api/painel/users')->assertForbidden();

    $this->comoAdulto($educador)
        ->postJson('/api/painel/users', [
            'name' => 'Sem Permissao',
            'email' => 'denied@example.com',
            'role' => 'educador',
            'password' => 'secure123',
            'password_confirmation' => 'secure123',
        ])
        ->assertForbidden();

    expect(User::where('email', 'denied@example.com')->exists())->toBeFalse();
});

it('admin lista os usuários sem expor o hash da senha', function () {
    User::factory()->count(2)->create();

    $this->comoAdulto($this->admin)
        ->getJson('/api/painel/users')
        ->assertOk()
        ->assertJsonCount(3)
        ->assertJsonMissingPath('0.password');
});

it('admin não rebaixa o próprio papel', function () {
    $this->comoAdulto($this->admin)
        ->putJson("/api/painel/users/{$this->admin->id}", [
            'name' => $this->admin->name,
            'email' => $this->admin->email,
            'role' => 'educador',
            'is_active' => true,
        ])
        ->assertStatus(422)
        ->assertJson(['message' => 'Seu proprio nivel de acesso nao pode ser alterado por esta tela.']);
});

it('admin não desativa a própria conta', function () {
    $this->comoAdulto($this->admin)
        ->putJson("/api/painel/users/{$this->admin->id}", [
            'name' => $this->admin->name,
            'email' => $this->admin->email,
            'role' => 'admin',
            'is_active' => false,
        ])
        ->assertStatus(422)
        ->assertJson(['message' => 'Seu proprio acesso nao pode ser desativado por esta tela.']);
});

it('o último admin ativo não pode ser rebaixado por outro caminho', function () {
    $outroAdmin = User::factory()->admin()->create();

    // Dois admins: rebaixar um é permitido.
    $this->comoAdulto($this->admin)
        ->putJson("/api/painel/users/{$outroAdmin->id}", [
            'name' => $outroAdmin->name,
            'email' => $outroAdmin->email,
            'role' => 'educador',
            'is_active' => true,
        ])
        ->assertOk()
        ->assertJsonPath('role', 'educador');

    // Agora só sobrou um: o segundo (já educador) não consegue rebaixar o último.
    $outroAdmin->refresh();
    $this->comoAdulto($outroAdmin)
        ->putJson("/api/painel/users/{$this->admin->id}", [
            'name' => $this->admin->name,
            'email' => $this->admin->email,
            'role' => 'educador',
            'is_active' => true,
        ])
        ->assertForbidden();
});

it('admin atualiza dados, situação e senha de um educador', function () {
    $user = User::factory()->create(['password' => Hash::make('secret-123')]);

    $this->comoAdulto($this->admin)
        ->putJson("/api/painel/users/{$user->id}", [
            'name' => 'Nome Novo',
            'email' => 'novo@example.com',
            'role' => 'educador',
            'is_active' => false,
            'password' => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ])
        ->assertOk()
        ->assertJsonPath('name', 'Nome Novo')
        ->assertJsonPath('email', 'novo@example.com')
        ->assertJsonPath('is_active', false);

    $user->refresh();
    expect($user->is_active)->toBeFalse()
        ->and(Hash::check('novaSenha123', $user->password))->toBeTrue();
});
