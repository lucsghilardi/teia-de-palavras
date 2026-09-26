<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tema Espaço: avatares/figuras por ícone + cor (sem emoji na tela), narração
 * automática opcional por criança e "texto como escrito" (usa_minusculas)
 * como padrão para crianças novas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('opcoes_visuais', function (Blueprint $table) {
            $table->string('icone', 40)->nullable()->after('emoji');
            $table->string('cor', 7)->nullable()->after('icone');
        });

        Schema::table('criancas', function (Blueprint $table) {
            $table->boolean('narracao_automatica')->default(true)->after('usa_minusculas');
            $table->boolean('usa_minusculas')->default(true)->change();
        });
    }

    public function down(): void
    {
        Schema::table('criancas', function (Blueprint $table) {
            $table->dropColumn('narracao_automatica');
            $table->boolean('usa_minusculas')->default(false)->change();
        });

        Schema::table('opcoes_visuais', function (Blueprint $table) {
            $table->dropColumn(['icone', 'cor']);
        });
    }
};
