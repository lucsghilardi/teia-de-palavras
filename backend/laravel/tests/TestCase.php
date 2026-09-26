<?php

namespace Tests;

use App\Models\Crianca;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Facades\JWTAuth;

abstract class TestCase extends BaseTestCase
{
    /**
     * Cada requisição parte de autenticação limpa, como em produção. Sem isto
     * o guard JWT (singleton) guardaria o usuário/token da requisição anterior
     * e um token já invalidado continuaria "funcionando" no mesmo teste.
     */
    public function call($method, $uri, $parameters = [], $cookies = [], $files = [], $server = [], $content = null)
    {
        Auth::forgetGuards();
        app('tymon.jwt')->unsetToken();

        return parent::call($method, $uri, $parameters, $cookies, $files, $server, $content);
    }

    /** Valor do header Authorization com um JWT do guard `api` (adulto). */
    protected function bearerTokenFor(User $user): string
    {
        return 'Bearer '.JWTAuth::fromUser($user);
    }

    /** Atalho: requisição autenticada como esta criança (guard `crianca`). */
    protected function comoCrianca(Crianca $crianca): static
    {
        return $this->withHeader('Authorization', 'Bearer '.auth('crianca')->login($crianca));
    }

    /** Atalho: requisição autenticada como este adulto. */
    protected function comoAdulto(User $user): static
    {
        return $this->withHeader('Authorization', $this->bearerTokenFor($user));
    }
}
