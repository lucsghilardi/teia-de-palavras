<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

function criarAdulto(array $extra = []): User
{
    return User::factory()->create([
        'password' => Hash::make('secret-123'),
        ...$extra,
    ]);
}

function entrar(User $user): string
{
    return test()->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'secret-123',
    ])->assertOk()->json('access_token');
}

it('faz login com credenciais válidas', function () {
    $user = criarAdulto(['role' => 'admin']);

    $this->postJson('/api/login', ['email' => $user->email, 'password' => 'secret-123'])
        ->assertOk()
        ->assertJsonStructure(['access_token', 'token_type', 'expires_in']);
});

it('normaliza o e-mail no login (maiúsculas e espaços)', function () {
    $user = criarAdulto(['email' => 'educador@example.com']);

    $this->postJson('/api/login', ['email' => '  Educador@Example.com ', 'password' => 'secret-123'])
        ->assertOk();
});

it('bloqueia o login após cinco tentativas inválidas', function () {
    $user = criarAdulto();

    foreach (range(1, 5) as $tentativa) {
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'errada'])
            ->assertUnauthorized()
            ->assertJson(['message' => 'Email ou senha invalidos.']);
    }

    $this->postJson('/api/login', ['email' => $user->email, 'password' => 'errada'])
        ->assertStatus(429)
        ->assertJsonStructure(['message', 'retry_after']);
});

it('devolve o próprio usuário em /me sem o hash da senha', function () {
    $user = criarAdulto();
    $token = entrar($user);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('email', $user->email)
        ->assertJsonPath('role', 'educador')
        ->assertJsonMissingPath('password');
});

it('invalida o token no logout', function () {
    $user = criarAdulto();
    $token = entrar($user);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/logout')
        ->assertOk()
        ->assertJson(['message' => 'Sessao encerrada com sucesso.']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/me')
        ->assertUnauthorized();
});

it('não deixa usuário inativo entrar', function () {
    $user = criarAdulto(['is_active' => false]);

    $this->postJson('/api/login', ['email' => $user->email, 'password' => 'secret-123'])
        ->assertUnauthorized()
        ->assertJson(['message' => 'Email ou senha invalidos.']);
});

it('rejeita o token de quem foi desativado depois de entrar', function () {
    $user = criarAdulto();
    $token = entrar($user);

    $user->forceFill(['is_active' => false])->save();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/me')
        ->assertUnauthorized()
        ->assertJson(['message' => 'Sessao invalida para este usuario.']);
});

it('renova o token pelo refresh e invalida o antigo', function () {
    $user = criarAdulto();
    $antigo = entrar($user);

    $novo = $this->withHeader('Authorization', "Bearer {$antigo}")
        ->postJson('/api/refresh')
        ->assertOk()
        ->assertJsonStructure(['access_token', 'token_type', 'expires_in'])
        ->json('access_token');

    expect($novo)->not->toBe($antigo);

    $this->withHeader('Authorization', "Bearer {$novo}")
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('id', $user->id);

    // O antigo entrou na blacklist.
    $this->withHeader('Authorization', "Bearer {$antigo}")
        ->getJson('/api/me')
        ->assertUnauthorized();
});

it('não renova a sessão de usuário desativado', function () {
    $user = criarAdulto();
    $token = entrar($user);

    $user->forceFill(['is_active' => false])->save();

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/refresh')
        ->assertUnauthorized()
        ->assertJson(['message' => 'Sessao invalida para este usuario.']);
});

it('responde 401 ao refresh sem token', function () {
    $this->postJson('/api/refresh')
        ->assertUnauthorized()
        ->assertJson(['message' => 'Sessao expirada.']);
});

it('responde 401 em JSON para rota protegida sem token', function () {
    $this->getJson('/api/me')
        ->assertUnauthorized()
        ->assertJson(['message' => 'Unauthenticated.']);
});
