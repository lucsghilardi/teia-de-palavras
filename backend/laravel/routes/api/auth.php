<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MeController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

// Fora do auth:api de propósito: o token chega vencido e é trocado aqui.
Route::post('/refresh', [AuthController::class, 'refresh']);

Route::middleware(['auth:api', 'panel.active'])->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/me/password', [MeController::class, 'updatePassword']);
});
