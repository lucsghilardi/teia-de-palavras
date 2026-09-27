<?php

use App\Http\Controllers\Api\Crianca\AtividadeController;
use App\Http\Controllers\Api\Crianca\AudioController;
use App\Http\Controllers\Api\Crianca\AulaController;
use App\Http\Controllers\Api\Crianca\EntradaController;
use App\Http\Controllers\Api\Crianca\GalaxiaController;
use App\Http\Controllers\Api\Crianca\MapaController;
use App\Http\Controllers\Api\Crianca\MedalhaController;
use App\Http\Controllers\Api\Crianca\MiniAulaController;
use App\Http\Controllers\Api\Crianca\PerfilController;
use App\Http\Controllers\Api\Crianca\RevisaoController;
use App\Http\Controllers\Api\Crianca\TeiaController;
use App\Http\Controllers\Api\Crianca\VozArquivoController;
use App\Http\Controllers\Api\Crianca\VozController;
use Illuminate\Support\Facades\Route;

/*
| App da criança (guard crianca). Contrato em docs/api-crianca.md.
*/
Route::prefix('crianca')->group(function () {
    Route::get('/turma/{codigo}', [EntradaController::class, 'turma'])->middleware('throttle:crianca-turma');
    Route::post('/login', [EntradaController::class, 'login'])->middleware('throttle:crianca-login');
    Route::post('/refresh', [EntradaController::class, 'refresh']);
    // Voz neural em cache: pública porque as telas de entrada falam antes do
    // login (o proxy repassa sem Bearer). Sem provedor configurado responde 204.
    Route::get('/voz', VozController::class)->middleware('throttle:voz');

    Route::middleware(['auth:crianca', 'crianca.ativa'])->group(function () {
        Route::get('/eu', [PerfilController::class, 'eu']);
        Route::post('/sair', [EntradaController::class, 'sair']);
        Route::post('/sessao/pulso', [PerfilController::class, 'pulso']);

        Route::get('/galaxia', GalaxiaController::class);
        Route::get('/mapa', MapaController::class);
        Route::get('/teia', TeiaController::class);
        Route::get('/medalhas', MedalhaController::class);
        Route::get('/revisao', [RevisaoController::class, 'index']);
        Route::post('/revisao/{item}/responder', [RevisaoController::class, 'responder'])->whereNumber('item');
        Route::get('/audios/{gravacao}', AudioController::class)->whereNumber('gravacao');

        // Base dos amigos: dar uma mini-aula e jogar as recebidas.
        Route::get('/mini-aulas/modelos', [MiniAulaController::class, 'modelos']);
        Route::post('/mini-aulas', [MiniAulaController::class, 'store'])->middleware('throttle:mini-aulas');
        Route::get('/mini-aulas/minhas', [MiniAulaController::class, 'minhas']);
        Route::get('/mini-aulas/recebidas', [MiniAulaController::class, 'recebidas']);
        Route::get('/mini-aulas/entregas/{entrega}', [MiniAulaController::class, 'show'])->whereNumber('entrega');
        Route::post('/mini-aulas/entregas/{entrega}/responder', [MiniAulaController::class, 'responder'])->whereNumber('entrega');
        Route::post('/mini-aulas/entregas/{entrega}/reagir', [MiniAulaController::class, 'reagir'])->whereNumber('entrega');

        Route::get('/aulas/{aula}', [AulaController::class, 'show'])->whereNumber('aula');
        Route::post('/aulas/{aula}/iniciar', [AulaController::class, 'iniciar'])->whereNumber('aula');
        Route::post('/aulas/{aula}/etapas/{etapa}/concluir', [AulaController::class, 'concluirEtapa'])->whereNumber(['aula', 'etapa']);
        Route::post('/aulas/{aula}/atividades/{ordem}/responder', [AtividadeController::class, 'responder'])->whereNumber(['aula', 'ordem']);
        Route::post('/aulas/{aula}/tentativas', [AulaController::class, 'tentativa'])->whereNumber('aula');
        Route::post('/aulas/{aula}/producao', [AulaController::class, 'producao'])->whereNumber('aula');
        Route::post('/aulas/{aula}/concluir', [AulaController::class, 'concluir'])->whereNumber('aula');
    });
});

// Arquivos da voz neural: nome = hash do conteúdo, cache de um ano no navegador.
// Fora do prefixo `crianca` porque o <audio> carrega direto do APP_URL, sem
// proxy nem Bearer; e fora do throttle geral por IP (a escola inteira sai por
// um IP só).
Route::get('/vozes/{hash}.mp3', VozArquivoController::class)
    ->where('hash', '[a-f0-9]{64}')
    ->withoutMiddleware('throttle:api')
    ->middleware('throttle:vozes')
    ->name('vozes.arquivo');
