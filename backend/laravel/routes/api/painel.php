<?php

use App\Http\Controllers\Api\Painel\AmizadeController;
use App\Http\Controllers\Api\Painel\AulaController;
use App\Http\Controllers\Api\Painel\ConfiguracaoController;
use App\Http\Controllers\Api\Painel\CriancaController;
use App\Http\Controllers\Api\Painel\DicionarioController;
use App\Http\Controllers\Api\Painel\MiniAulaController;
use App\Http\Controllers\Api\Painel\OpcaoVisualController;
use App\Http\Controllers\Api\Painel\TurmaController;
use App\Http\Controllers\Api\Painel\UserController;
use Illuminate\Support\Facades\Route;

/*
| Painel do adulto (guard api). Contrato em docs/api-painel.md.
| Permissões finas ficam nas Policies (Turma, Crianca, Aula).
*/
Route::middleware(['auth:api', 'panel.active', 'role:admin,educador'])->prefix('painel')->group(function () {
    Route::get('/opcoes-visuais', OpcaoVisualController::class);

    Route::apiResource('turmas', TurmaController::class)->whereNumber('turma');
    Route::post('/turmas/{turma}/novo-codigo', [TurmaController::class, 'novoCodigo'])->whereNumber('turma');

    Route::apiResource('criancas', CriancaController::class)->whereNumber('crianca');
    Route::post('/criancas/{crianca}/figura-secreta', [CriancaController::class, 'figuraSecreta'])->whereNumber('crianca');
    Route::post('/criancas/{crianca}/solicitar-exclusao', [CriancaController::class, 'solicitarExclusao'])->whereNumber('crianca');

    Route::put('/aulas/reordenar', [AulaController::class, 'reordenar']);
    Route::apiResource('aulas', AulaController::class)->whereNumber('aula');
    Route::post('/aulas/{aula}/publicar', [AulaController::class, 'publicar'])->whereNumber('aula');
    Route::post('/aulas/{aula}/despublicar', [AulaController::class, 'despublicar'])->whereNumber('aula');
    Route::post('/aulas/{aula}/midia', [AulaController::class, 'enviarMidia'])->whereNumber('aula');
    Route::delete('/aulas/{aula}/midia', [AulaController::class, 'removerMidia'])->whereNumber('aula');
    Route::post('/silabas/sugerir-familia', [AulaController::class, 'sugerirFamilia']);

    Route::get('/dicionario', [DicionarioController::class, 'index']);
    Route::post('/dicionario', [DicionarioController::class, 'store']);
    Route::post('/dicionario/importar', [DicionarioController::class, 'importar']);
    Route::put('/dicionario/{palavra}', [DicionarioController::class, 'update'])->whereNumber('palavra');
    Route::delete('/dicionario/{palavra}', [DicionarioController::class, 'destroy'])->whereNumber('palavra');

    Route::get('/amizades', [AmizadeController::class, 'index']);
    Route::post('/amizades', [AmizadeController::class, 'store']);
    Route::post('/amizades/aceitar', [AmizadeController::class, 'aceitar']);
    Route::delete('/amizades/{amizade}', [AmizadeController::class, 'destroy'])->whereNumber('amizade');

    Route::get('/mini-aulas', [MiniAulaController::class, 'index']);
    Route::post('/mini-aulas/{miniAula}/aprovar', [MiniAulaController::class, 'aprovar'])->whereNumber('miniAula');
    Route::post('/mini-aulas/{miniAula}/recusar', [MiniAulaController::class, 'recusar'])->whereNumber('miniAula');
    Route::get('/mini-aulas/{miniAula}/audio', [MiniAulaController::class, 'audio'])->whereNumber('miniAula');

    Route::get('/configuracoes', [ConfiguracaoController::class, 'show']);
    Route::put('/configuracoes', [ConfiguracaoController::class, 'update']);

    // Só admin (a UserPolicy também confere; o middleware corta antes).
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update'])->whereNumber('user');
    });
});
