<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->user = User::factory()->create(['password' => Hash::make('senha-atual-1')]);
});

it('troca a própria senha e devolve um token novo que já funciona', function () {
    $resposta = $this->comoAdulto($this->user)
        ->putJson('/api/me/password', [
            'senha_atual' => 'senha-atual-1',
            'password' => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ])
        ->assertOk()
        ->assertJsonStructure(['message', 'access_token', 'expires_in']);

    expect(Hash::check('novaSenha123', $this->user->fresh()->password))->toBeTrue();

    // A rota do Next reescreve o cookie com o token novo; ele tem que valer já.
    $this->withHeader('Authorization', 'Bearer '.$resposta->json('access_token'))
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('id', $this->user->id);
});

it('não troca nada quando a senha atual está errada', function () {
    $this->comoAdulto($this->user)
        ->putJson('/api/me/password', [
            'senha_atual' => 'chute-errado',
            'password' => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ])
        ->assertStatus(422)
        ->assertJson(['message' => 'A senha atual não confere.']);

    expect(Hash::check('senha-atual-1', $this->user->fresh()->password))->toBeTrue();
});

it('recusa confirmação diferente', function () {
    $this->comoAdulto($this->user)
        ->putJson('/api/me/password', [
            'senha_atual' => 'senha-atual-1',
            'password' => 'novaSenha123',
            'password_confirmation' => 'outraCoisa123',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('password');
});

it('barra tentativas repetidas de senha atual (oráculo)', function () {
    foreach (range(1, 5) as $i) {
        $this->comoAdulto($this->user)
            ->putJson('/api/me/password', [
                'senha_atual' => "chute-{$i}",
                'password' => 'novaSenha123',
                'password_confirmation' => 'novaSenha123',
            ])
            ->assertStatus(422);
    }

    $this->comoAdulto($this->user)
        ->putJson('/api/me/password', [
            'senha_atual' => 'senha-atual-1',
            'password' => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ])
        ->assertStatus(429)
        ->assertJsonStructure(['message', 'retry_after']);

    expect(Hash::check('senha-atual-1', $this->user->fresh()->password))->toBeTrue();
});

it('exige token', function () {
    $this->putJson('/api/me/password', [
        'senha_atual' => 'x',
        'password' => 'novaSenha123',
        'password_confirmation' => 'novaSenha123',
    ])->assertUnauthorized();
});

it('não deixa usuário desativado trocar a senha', function () {
    $token = $this->bearerTokenFor($this->user);
    $this->user->update(['is_active' => false]);

    $this->withHeader('Authorization', $token)
        ->putJson('/api/me/password', [
            'senha_atual' => 'senha-atual-1',
            'password' => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ])
        ->assertUnauthorized();

    expect(Hash::check('senha-atual-1', $this->user->fresh()->password))->toBeTrue();
});
