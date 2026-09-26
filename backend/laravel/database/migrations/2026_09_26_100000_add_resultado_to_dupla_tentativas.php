<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Guarda o resultado da validação quando o parceiro confirma a proposta. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dupla_tentativas', function (Blueprint $table) {
            $table->boolean('valida')->nullable()->after('status');
            $table->string('dica', 200)->nullable()->after('palavra_resultado');
        });

        Schema::table('turma_sessoes', function (Blueprint $table) {
            $table->index(['turma_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('dupla_tentativas', fn (Blueprint $table) => $table->dropColumn(['valida', 'dica']));
        Schema::table('turma_sessoes', fn (Blueprint $table) => $table->dropIndex(['turma_id', 'status']));
    }
};
