<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Revisão espaçada (caixas de Leitner): cada item que a criança respondeu
 * (um fato, uma palavra, uma pergunta) com a caixa atual e a próxima data.
 * `dados` guarda o tipo e o config de uma atividade de um item só, para a
 * "Revisão" remontar a pergunta pelo registro de tipos.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crianca_itens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->string('disciplina', 20)->default('portugues');
            $table->string('chave', 80);
            $table->jsonb('dados');
            $table->unsignedSmallInteger('caixa')->default(0);
            $table->unsignedInteger('acertos')->default(0);
            $table->unsignedInteger('erros')->default(0);
            $table->boolean('ultimo_resultado')->nullable();
            $table->date('proxima_revisao_em');
            $table->timestamp('revisado_em')->nullable();
            $table->timestamps();
            $table->unique(['crianca_id', 'chave']);
            $table->index(['crianca_id', 'proxima_revisao_em']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crianca_itens');
    }
};
