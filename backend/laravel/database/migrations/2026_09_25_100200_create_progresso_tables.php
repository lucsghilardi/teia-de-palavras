<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Progresso da criança: aulas, Teia de Palavras, sílabas dominadas, sessões,
 * eventos, produções, gravações, sugestões de palavras e gamificação.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crianca_aulas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->foreignId('aula_id')->constrained('aulas')->cascadeOnDelete();
            $table->string('status', 20)->default('disponivel'); // disponivel | em_andamento | concluida
            $table->unsignedSmallInteger('etapa_atual')->default(1);
            $table->timestamp('iniciada_em')->nullable();
            $table->timestamp('concluida_em')->nullable();
            $table->timestamps();
            $table->unique(['crianca_id', 'aula_id']);
        });

        Schema::create('teia_palavras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->string('palavra_normalizada', 40);
            $table->string('palavra_exibida', 40);
            $table->json('silabas');
            $table->foreignId('aula_id')->nullable()->constrained('aulas')->nullOnDelete();
            $table->string('origem', 20)->default('criacao'); // criacao | producao | dupla | sugestao
            $table->timestamp('descoberta_em');
            $table->timestamps();
            $table->unique(['crianca_id', 'palavra_normalizada']);
        });

        Schema::create('crianca_silabas', function (Blueprint $table) {
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->foreignId('silaba_id')->constrained('silabas')->cascadeOnDelete();
            $table->unsignedInteger('vezes_usada')->default(0);
            $table->timestamp('primeira_vez_em')->nullable();
            $table->timestamp('dominada_em')->nullable();
            $table->timestamps();
            $table->primary(['crianca_id', 'silaba_id']);
        });

        Schema::create('sessoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->timestamp('iniciada_em');
            $table->timestamp('ultima_atividade_em');
            $table->timestamp('encerrada_em')->nullable();
            $table->string('origem', 20)->default('individual'); // individual | turma
            $table->unsignedBigInteger('turma_sessao_id')->nullable(); // FK adicionada na migration do modo turma
            $table->string('dispositivo', 120)->nullable();
            $table->timestamps();
            $table->index(['crianca_id', 'iniciada_em']);
        });

        Schema::create('eventos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sessao_id')->constrained('sessoes')->cascadeOnDelete();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->foreignId('aula_id')->nullable()->constrained('aulas')->nullOnDelete();
            $table->unsignedSmallInteger('etapa')->nullable();
            $table->string('tipo', 40);
            $table->jsonb('dados')->nullable();
            $table->timestamp('ocorrido_em');
            $table->index(['crianca_id', 'ocorrido_em']);
        });

        // Áudios das crianças: disco PRIVADO, servidos por rota autenticada.
        Schema::create('gravacoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->foreignId('sessao_id')->nullable()->constrained('sessoes')->nullOnDelete();
            $table->string('alvo_tipo', 20); // palavra | silaba | pergunta | producao | sugestao
            $table->unsignedBigInteger('alvo_id')->nullable();
            $table->foreignId('aula_id')->nullable()->constrained('aulas')->nullOnDelete();
            $table->string('arquivo_path');
            $table->unsignedInteger('duracao_ms')->nullable();
            $table->string('mime', 60)->nullable();
            $table->string('status', 20)->default('pendente'); // pendente | aprovada | recusada
            $table->foreignId('revisada_por_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('revisada_em')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['alvo_tipo', 'alvo_id', 'status']);
        });

        Schema::create('producoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->foreignId('aula_id')->nullable()->constrained('aulas')->nullOnDelete();
            $table->string('texto', 300)->nullable();
            $table->foreignId('gravacao_id')->nullable()->constrained('gravacoes')->nullOnDelete();
            $table->json('palavras')->nullable();
            $table->timestamps();
        });

        Schema::create('sugestoes_palavras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->string('palavra_texto', 40)->nullable();
            $table->foreignId('gravacao_id')->nullable()->constrained('gravacoes')->nullOnDelete();
            $table->string('status', 20)->default('pendente'); // pendente | aprovada | recusada
            $table->foreignId('revisada_por_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('revisada_em')->nullable();
            $table->foreignId('palavra_id')->nullable()->constrained('palavras')->nullOnDelete();
            $table->foreignId('virou_aula_id')->nullable()->constrained('aulas')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('crianca_estatisticas', function (Blueprint $table) {
            $table->foreignId('crianca_id')->primary()->constrained('criancas')->cascadeOnDelete();
            $table->unsignedInteger('xp_total')->default(0);
            $table->unsignedInteger('nivel')->default(1);
            $table->unsignedInteger('sequencia_atual')->default(0);
            $table->unsignedInteger('maior_sequencia')->default(0);
            $table->date('ultimo_dia_ativo')->nullable();
            $table->timestamps();
        });

        Schema::create('crianca_conquistas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->string('chave', 40);
            $table->timestamp('desbloqueada_em');
            $table->unique(['crianca_id', 'chave']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crianca_conquistas');
        Schema::dropIfExists('crianca_estatisticas');
        Schema::dropIfExists('sugestoes_palavras');
        Schema::dropIfExists('producoes');
        Schema::dropIfExists('gravacoes');
        Schema::dropIfExists('eventos');
        Schema::dropIfExists('sessoes');
        Schema::dropIfExists('crianca_silabas');
        Schema::dropIfExists('teia_palavras');
        Schema::dropIfExists('crianca_aulas');
    }
};
