<?php

use Illuminate\Support\Facades\Route;

/*
| Rotas da API, agrupadas por área (todas sob o prefixo /api):
|  - auth.php    sessão do adulto (login, refresh, me, logout, senha)
|  - painel.php  painel do educador/admin (guard api)
|  - crianca.php app da criança (guard crianca)
|  - turma.php   modo turma em tempo real              [Fase 3]
*/

Route::get('/health', fn () => response()->json(['status' => 'ok']));

require __DIR__.'/api/auth.php';
require __DIR__.'/api/painel.php';
require __DIR__.'/api/crianca.php';
