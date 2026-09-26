<?php

use App\Models\Crianca;
use App\Models\User;

return [

    'defaults' => [
        'guard' => 'api',
        'passwords' => 'users',
    ],

    /*
    | Dois guards JWT (tymon), cada um com o seu provider. O tymon grava a claim
    | `prv` (hash do model do provider) no token, então um token de criança
    | não é aceito pelo guard `api` nem o contrário.
    |  - api:     adulto do painel (User) — e-mail + senha
    |  - crianca: criança do app (Crianca) — avatar + figura secreta
    */
    'guards' => [
        'api' => [
            'driver' => 'jwt',
            'provider' => 'users',
        ],
        'crianca' => [
            'driver' => 'jwt',
            'provider' => 'criancas',
        ],
    ],

    'providers' => [
        'users' => [
            'driver' => 'eloquent',
            'model' => User::class,
        ],
        'criancas' => [
            'driver' => 'eloquent',
            'model' => Crianca::class,
        ],
    ],

    'passwords' => [
        'users' => [
            'provider' => 'users',
            'table' => env('AUTH_PASSWORD_RESET_TOKEN_TABLE', 'password_reset_tokens'),
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];
