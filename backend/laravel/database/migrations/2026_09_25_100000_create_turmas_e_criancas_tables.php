<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Identidade e privacidade: turmas, crianças (dados mínimos), consentimentos e
 * o catálogo de avatares/figuras secretas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('turmas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('educador_user_id')->constrained('users')->restrictOnDelete();
            $table->string('nome', 80);
            // Código curto que o adulto digita uma vez no dispositivo (e que vira QR).
            $table->string('codigo', 6)->unique();
            $table->boolean('ativa')->default(true);
            $table->timestamps();
        });

        Schema::create('criancas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('turma_id')->constrained('turmas')->restrictOnDelete();
            $table->foreignId('responsavel_user_id')->constrained('users')->restrictOnDelete();
            // LGPD: só apelido, avatar e turma. Sem nome completo, foto ou e-mail.
            $table->string('apelido', 40);
            $table->string('avatar_chave', 40);
            // A figura secreta é 1 entre poucas: o hash é cortesia, o que protege
            // é o teto de tentativas + bloqueio.
            $table->string('figura_secreta_hash');
            $table->boolean('usa_minusculas')->default(false);
            $table->unsignedSmallInteger('tentativas_login_falhas')->default(0);
            $table->timestamp('bloqueada_ate')->nullable();
            $table->timestamp('exclusao_solicitada_em')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Apelido único por turma entre as crianças ativas (a tela de entrada
        // mostra apelido + avatar). Índice parcial: só PostgreSQL.
        DB::statement('CREATE UNIQUE INDEX criancas_turma_apelido_unico ON criancas (turma_id, apelido) WHERE deleted_at IS NULL');

        Schema::create('consentimentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('crianca_id')->constrained('criancas')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('versao_texto', 20);
            $table->timestamp('aceito_em');
            $table->string('ip', 45)->nullable();
            $table->timestamp('revogado_em')->nullable();
            $table->timestamps();
        });

        Schema::create('opcoes_visuais', function (Blueprint $table) {
            $table->id();
            $table->string('tipo', 20); // avatar | figura_secreta
            $table->string('chave', 40)->unique();
            $table->string('rotulo', 60);
            // Placeholder editável: emoji até a ilustração final existir.
            $table->string('emoji', 16)->nullable();
            $table->string('imagem_path')->nullable();
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->boolean('ativa')->default(true);
            $table->timestamps();
            $table->index(['tipo', 'ativa', 'ordem']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opcoes_visuais');
        Schema::dropIfExists('consentimentos');
        Schema::dropIfExists('criancas');
        Schema::dropIfExists('turmas');
    }
};
