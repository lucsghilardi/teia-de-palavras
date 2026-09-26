<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Conteúdo editado no CMS: aulas (missões), história, perguntas, sílabas,
 * famílias silábicas, dicionário da aula, dicionário geral e configurações.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aulas', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 80)->unique();
            $table->string('titulo', 120);
            $table->unsignedSmallInteger('fase')->default(1);
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->string('palavra_geradora', 40);
            $table->string('palavra_imagem_path')->nullable();
            $table->string('palavra_audio_path')->nullable();
            $table->foreignId('pre_requisito_aula_id')->nullable()->constrained('aulas')->nullOnDelete();
            $table->string('status', 20)->default('rascunho'); // rascunho | publicada
            $table->foreignId('criada_por_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['fase', 'ordem']);
        });

        Schema::create('aula_historia_paginas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aula_id')->constrained('aulas')->cascadeOnDelete();
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->text('texto');
            $table->string('imagem_path')->nullable();
            $table->string('audio_path')->nullable();
            $table->timestamps();
        });

        Schema::create('aula_perguntas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aula_id')->constrained('aulas')->cascadeOnDelete();
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->string('texto', 300);
            $table->string('audio_path')->nullable();
            $table->timestamps();
        });

        // Catálogo global de sílabas: a mesma "TA" da aula TEIA é a "TA" que a
        // criança arrasta em qualquer aula posterior (e que pode ganhar áudio gravado).
        Schema::create('silabas', function (Blueprint $table) {
            $table->id();
            $table->string('texto', 8)->unique();
            $table->string('audio_path')->nullable();
            $table->timestamps();
        });

        // Sílabas da palavra geradora, na ordem (as "palmas").
        Schema::create('aula_silabas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aula_id')->constrained('aulas')->cascadeOnDelete();
            $table->foreignId('silaba_id')->constrained('silabas')->restrictOnDelete();
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->timestamps();
            $table->unique(['aula_id', 'ordem']);
        });

        // Família que cada sílaba da aula libera. Editável, não derivada:
        // SALVA tem a palma "SAL" mas a família SA SE SI SO SU.
        Schema::create('aula_familias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aula_id')->constrained('aulas')->cascadeOnDelete();
            $table->foreignId('aula_silaba_id')->constrained('aula_silabas')->cascadeOnDelete();
            $table->foreignId('silaba_id')->constrained('silabas')->restrictOnDelete();
            $table->unsignedSmallInteger('ordem')->default(0);
            $table->timestamps();
            $table->unique(['aula_silaba_id', 'silaba_id']);
            $table->index('aula_id');
        });

        // Dicionário da aula: palavras que a missão espera que a criança descubra.
        Schema::create('aula_palavras', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aula_id')->constrained('aulas')->cascadeOnDelete();
            $table->string('palavra', 40);
            $table->string('palavra_normalizada', 40);
            $table->json('silabas');
            $table->string('imagem_path')->nullable();
            $table->string('audio_path')->nullable();
            $table->boolean('destaque')->default(false);
            $table->timestamps();
            $table->unique(['aula_id', 'palavra_normalizada']);
        });

        // Dicionário geral de palavras permitidas (seed, CMS e sugestões aprovadas).
        Schema::create('palavras', function (Blueprint $table) {
            $table->id();
            $table->string('palavra', 40);
            $table->string('palavra_normalizada', 40)->unique();
            $table->json('silabas');
            $table->string('origem', 20)->default('seed'); // seed | cms | sugestao
            $table->boolean('aprovada')->default(false);
            $table->foreignId('aprovada_por_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('aprovada_em')->nullable();
            $table->timestamps();
        });

        Schema::create('configuracoes', function (Blueprint $table) {
            $table->string('chave', 60)->primary();
            $table->text('valor')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuracoes');
        Schema::dropIfExists('palavras');
        Schema::dropIfExists('aula_palavras');
        Schema::dropIfExists('aula_familias');
        Schema::dropIfExists('aula_silabas');
        Schema::dropIfExists('silabas');
        Schema::dropIfExists('aula_perguntas');
        Schema::dropIfExists('aula_historia_paginas');
        Schema::dropIfExists('aulas');
    }
};
