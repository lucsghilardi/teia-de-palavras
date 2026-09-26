<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Roda com escopo contido: a dupla propõe/confirma numa atividade qualquer
 * (montar palavras ou avaliada), não só sílabas. A tentativa guarda a resposta
 * genérica, a ordem da atividade e o resultado da avaliação.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dupla_tentativas', function (Blueprint $table) {
            $table->json('silabas')->nullable()->change();
            $table->unsignedSmallInteger('atividade_ordem')->nullable()->after('dupla_id');
            $table->jsonb('resposta')->nullable()->after('silabas');
            $table->jsonb('resultado')->nullable()->after('dica');
        });
    }

    public function down(): void
    {
        Schema::table('dupla_tentativas', function (Blueprint $table) {
            $table->dropColumn(['atividade_ordem', 'resposta', 'resultado']);
        });
    }
};
