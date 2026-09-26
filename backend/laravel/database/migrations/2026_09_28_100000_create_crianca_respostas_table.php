<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Respostas da criança às atividades avaliadas: uma linha por item, com o
 * número de tentativas (política "dica no 1º erro, resposta no 2º") e se
 * acertou. XP só entra no primeiro acerto do item.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crianca_respostas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->foreignId('aula_atividade_id')->constrained('aula_atividades')->cascadeOnDelete();
            $table->string('item', 40)->default('unico');
            $table->unsignedSmallInteger('tentativas')->default(0);
            $table->boolean('acertou')->default(false);
            $table->boolean('acertou_na_primeira')->nullable();
            $table->jsonb('ultima_resposta')->nullable();
            $table->timestamps();
            $table->unique(['crianca_id', 'aula_atividade_id', 'item']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crianca_respostas');
    }
};
