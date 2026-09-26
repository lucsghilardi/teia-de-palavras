<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ensino entre pares: amizade entre turmas (dois responsáveis consentem) e
 * mini-aulas gravadas por crianças, aprovadas por um adulto e entregues às
 * crianças da própria turma e das turmas amigas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('turma_amizades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turma_a_id')->constrained('turmas')->cascadeOnDelete();
            $table->foreignId('turma_b_id')->nullable()->constrained('turmas')->cascadeOnDelete();
            $table->string('codigo', 8)->unique();
            $table->string('status', 20)->default('pendente'); // pendente | aceita | encerrada
            $table->string('termo_versao', 20)->nullable();
            $table->foreignId('gerada_por_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('aceita_por_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expira_em');
            $table->timestamp('aceita_em')->nullable();
            $table->timestamp('encerrada_em')->nullable();
            $table->timestamps();
            $table->index(['status', 'turma_a_id', 'turma_b_id']);
        });

        Schema::create('mini_aulas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('autor_crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->string('disciplina', 20);
            $table->foreignId('aula_origem_id')->nullable()->constrained('aulas')->nullOnDelete();
            $table->string('modelo', 60);
            $table->string('titulo', 80);
            $table->string('tipo', 30);
            $table->jsonb('config');
            $table->foreignId('gravacao_id')->nullable()->constrained('gravacoes')->nullOnDelete();
            $table->string('status', 20)->default('pendente'); // pendente | aprovada | recusada
            $table->foreignId('revisada_por_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('revisada_em')->nullable();
            $table->string('motivo_recusa', 200)->nullable();
            $table->unsignedSmallInteger('xp_autora')->default(0);
            $table->timestamps();
            $table->index(['status', 'created_at']);
            $table->index('autor_crianca_id');
        });

        Schema::create('mini_aula_entregas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mini_aula_id')->constrained('mini_aulas')->cascadeOnDelete();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->string('status', 20)->default('recebida'); // recebida | respondida
            $table->jsonb('resposta')->nullable();
            $table->boolean('correta')->nullable();
            $table->unsignedSmallInteger('tentativas')->default(0);
            $table->string('reacao', 20)->nullable();
            $table->timestamp('respondida_em')->nullable();
            $table->timestamps();
            $table->unique(['mini_aula_id', 'crianca_id']);
            $table->index(['crianca_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mini_aula_entregas');
        Schema::dropIfExists('mini_aulas');
        Schema::dropIfExists('turma_amizades');
    }
};
