<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Modo turma (círculo de cultura): sessão síncrona conduzida pelo educador,
 * participantes, criança-mestre e duplas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('turma_sessoes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turma_id')->constrained('turmas')->cascadeOnDelete();
            $table->foreignId('aula_id')->constrained('aulas')->restrictOnDelete();
            $table->foreignId('educador_user_id')->constrained('users')->restrictOnDelete();
            $table->string('codigo', 6);
            $table->string('status', 20)->default('aguardando'); // aguardando | em_andamento | encerrada
            $table->unsignedSmallInteger('etapa_atual')->default(1);
            $table->foreignId('crianca_mestre_id')->nullable()->constrained('criancas')->nullOnDelete();
            $table->jsonb('estado')->nullable(); // página da história, pergunta atual etc.
            $table->timestamp('iniciada_em')->nullable();
            $table->timestamp('encerrada_em')->nullable();
            $table->timestamps();
            $table->index(['codigo', 'status']);
        });

        Schema::table('sessoes', function (Blueprint $table) {
            $table->foreign('turma_sessao_id')->references('id')->on('turma_sessoes')->nullOnDelete();
        });

        Schema::create('turma_sessao_participantes', function (Blueprint $table) {
            $table->foreignId('turma_sessao_id')->constrained('turma_sessoes')->cascadeOnDelete();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->timestamp('entrou_em');
            $table->timestamp('saiu_em')->nullable();
            $table->timestamp('ultima_presenca_em')->nullable();
            $table->primary(['turma_sessao_id', 'crianca_id']);
        });

        Schema::create('duplas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turma_sessao_id')->constrained('turma_sessoes')->cascadeOnDelete();
            $table->foreignId('crianca_a_id')->constrained('criancas')->cascadeOnDelete();
            $table->foreignId('crianca_b_id')->constrained('criancas')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('dupla_tentativas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dupla_id')->constrained('duplas')->cascadeOnDelete();
            $table->json('silabas');
            $table->foreignId('proposta_por_crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->string('status', 20)->default('proposta'); // proposta | confirmada | recusada
            $table->string('palavra_resultado', 40)->nullable();
            $table->timestamp('respondida_em')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dupla_tentativas');
        Schema::dropIfExists('duplas');
        Schema::dropIfExists('turma_sessao_participantes');
        Schema::table('sessoes', fn (Blueprint $table) => $table->dropForeign(['turma_sessao_id']));
        Schema::dropIfExists('turma_sessoes');
    }
};
