<?php

use App\Http\Controllers\Api\Crianca\AtividadeController;
use App\Http\Controllers\Api\Crianca\AudioController;
use App\Http\Controllers\Api\Crianca\AulaController;
use App\Http\Controllers\Api\Crianca\EntradaController;
use App\Http\Controllers\Api\Crianca\MapaController;
use App\Http\Controllers\Api\Crianca\MedalhaController;
use App\Http\Controllers\Api\Crianca\PerfilController;
use App\Http\Controllers\Api\Crianca\RevisaoController;
use App\Http\Controllers\Api\Crianca\TeiaController;
use Illuminate\Support\Facades\Route;

/*
| App da criança (guard crianca). Contrato em docs/api-crianca.md.
*/
Route::prefix('crianca')->group(function () {
    Route::get('/turma/{codigo}', [EntradaController::class, 'turma'])->middleware('throttle:crianca-turma');
    Route::post('/login', [EntradaController::class, 'login'])->middleware('throttle:crianca-login');
    Route::post('/refresh', [EntradaController::class, 'refresh']);

    Route::middleware(['auth:crianca', 'crianca.ativa'])->group(function () {
        Route::get('/eu', [PerfilController::class, 'eu']);
        Route::post('/sair', [EntradaController::class, 'sair']);
        Route::post('/sessao/pulso', [PerfilController::class, 'pulso']);

        Route::get('/mapa', MapaController::class);
        Route::get('/teia', TeiaController::class);
        Route::get('/medalhas', MedalhaController::class);
        Route::get('/revisao', [RevisaoController::class, 'index']);
        Route::post('/revisao/{item}/responder', [RevisaoController::class, 'responder'])->whereNumber('item');
        Route::get('/audios/{gravacao}', AudioController::class)->whereNumber('gravacao');

        Route::get('/aulas/{aula}', [AulaController::class, 'show'])->whereNumber('aula');
        Route::post('/aulas/{aula}/iniciar', [AulaController::class, 'iniciar'])->whereNumber('aula');
        Route::post('/aulas/{aula}/etapas/{etapa}/concluir', [AulaController::class, 'concluirEtapa'])->whereNumber(['aula', 'etapa']);
        Route::post('/aulas/{aula}/atividades/{ordem}/responder', [AtividadeController::class, 'responder'])->whereNumber(['aula', 'ordem']);
        Route::post('/aulas/{aula}/tentativas', [AulaController::class, 'tentativa'])->whereNumber('aula');
        Route::post('/aulas/{aula}/producao', [AulaController::class, 'producao'])->whereNumber('aula');
        Route::post('/aulas/{aula}/concluir', [AulaController::class, 'concluir'])->whereNumber('aula');
    });
});
