<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Público a partir do 1º ano (6+): criança nova começa em caixa alta (letra de
 * imprensa maiúscula), como na alfabetização do 1º ano. "Texto como escrito"
 * (usa_minusculas) segue disponível por criança no painel. Só muda o padrão
 * da coluna: quem já existe fica como está.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('criancas', function (Blueprint $table) {
            $table->boolean('usa_minusculas')->default(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('criancas', function (Blueprint $table) {
            $table->boolean('usa_minusculas')->default(true)->change();
        });
    }
};
