<?php

use App\Http\Controllers\Api\Crianca\RodaController as RodaCriancaController;
use App\Http\Controllers\Api\Painel\RodaController as RodaPainelController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

/*
| A Roda (modo turma ao vivo). Contrato em docs/api-roda.md.
| Educador conduz pelo painel (guard api); crianças acompanham pelo app
| (guard crianca). Tempo real pelo canal de presença roda.{id}.
*/
Route::middleware(['auth:api', 'panel.active', 'role:admin,educador'])->prefix('painel')->group(function () {
    Route::get('/rodas', [RodaPainelController::class, 'index']);
    Route::post('/rodas', [RodaPainelController::class, 'store']);
    Route::get('/rodas/{roda}', [RodaPainelController::class, 'show'])->whereNumber('roda');
    Route::post('/rodas/{roda}/comandos', [RodaPainelController::class, 'comandos'])->whereNumber('roda');
    Route::post('/rodas/{roda}/duplas', [RodaPainelController::class, 'duplas'])->whereNumber('roda');
});

Route::prefix('crianca')->middleware(['auth:crianca', 'crianca.ativa'])->group(function () {
    // Autorização do canal de presença pela sessão da criança (via /api/crianca-proxy/broadcasting/auth).
    Route::post('/broadcasting/auth', fn (Request $request) => Broadcast::auth($request));

    Route::get('/roda', [RodaCriancaController::class, 'aberta']);
    Route::post('/rodas/entrar', [RodaCriancaController::class, 'entrar']);
    Route::get('/rodas/{roda}', [RodaCriancaController::class, 'show'])->whereNumber('roda');
    Route::post('/rodas/{roda}/sair', [RodaCriancaController::class, 'sair'])->whereNumber('roda');
    Route::post('/rodas/{roda}/dupla/propor', [RodaCriancaController::class, 'propor'])->whereNumber('roda');
    Route::post('/rodas/{roda}/dupla/responder', [RodaCriancaController::class, 'responder'])->whereNumber('roda');
    Route::post('/rodas/{roda}/tentativas', [RodaCriancaController::class, 'tentativa'])->whereNumber('roda');
    Route::post('/rodas/{roda}/producao', [RodaCriancaController::class, 'producao'])->whereNumber('roda');
    Route::post('/rodas/{roda}/atividades/{ordem}/responder', [RodaCriancaController::class, 'responderAtividade'])->whereNumber(['roda', 'ordem']);
});
