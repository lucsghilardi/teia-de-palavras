<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Temporada 1: cenas desenhadas pelo app (chave do registro de ilustrações do
 * front) na capa da missão, em cada página da história e em cada atividade;
 * e o fecho de episódio na conquista (desfecho + gancho do próximo). Imagem
 * enviada pelo painel continua vencendo a ilustração.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('aulas', function (Blueprint $table) {
            $table->string('ilustracao', 60)->nullable();
            $table->text('desfecho')->nullable();
            $table->text('gancho')->nullable();
        });

        Schema::table('aula_historia_paginas', function (Blueprint $table) {
            $table->string('ilustracao', 60)->nullable();
        });

        Schema::table('aula_atividades', function (Blueprint $table) {
            $table->string('ilustracao', 60)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('aula_atividades', fn (Blueprint $table) => $table->dropColumn('ilustracao'));
        Schema::table('aula_historia_paginas', fn (Blueprint $table) => $table->dropColumn('ilustracao'));
        Schema::table('aulas', fn (Blueprint $table) => $table->dropColumn(['ilustracao', 'desfecho', 'gancho']));
    }
};
