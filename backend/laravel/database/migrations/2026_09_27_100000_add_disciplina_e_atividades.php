<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Plataforma multidisciplinar: cada aula ganha uma disciplina e uma sequência
 * de atividades (aula_atividades). As aulas de Português já existentes recebem
 * a sequência legada (história, conversa, palavra, palmas, ficha, montar
 * palavras, frase), que continua lendo as tabelas especializadas. Com 7
 * atividades, a tela de conquista segue sendo a "etapa" 8, então o progresso
 * gravado em crianca_aulas.etapa_atual continua válido.
 */
return new class extends Migration
{
    /** Sequência legada das aulas de Português (não usar a classe do app aqui: ela pode mudar). */
    private const LEGADO_PORTUGUES = ['historia', 'conversa', 'palavra', 'palmas', 'ficha', 'montar_palavras', 'frase'];

    public function up(): void
    {
        Schema::table('aulas', function (Blueprint $table) {
            $table->string('disciplina', 20)->default('portugues')->after('slug');
            $table->string('rotulo', 30)->nullable()->after('titulo');
            $table->string('descricao', 200)->nullable()->after('rotulo');
            $table->string('habilidade_bncc', 40)->nullable()->after('descricao');
            $table->index('disciplina');
        });

        Schema::table('aulas', function (Blueprint $table) {
            $table->string('palavra_geradora', 40)->nullable()->change();
        });

        Schema::create('aula_atividades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aula_id')->constrained('aulas')->cascadeOnDelete();
            $table->unsignedSmallInteger('ordem')->default(1);
            $table->string('tipo', 30);
            $table->string('titulo', 80)->nullable();
            $table->string('instrucao', 200)->nullable();
            $table->jsonb('config')->default('{}');
            $table->string('imagem_path')->nullable();
            $table->timestamps();
            $table->unique(['aula_id', 'ordem']);
        });

        $this->preencherAtividadesLegadas();
    }

    public function down(): void
    {
        Schema::dropIfExists('aula_atividades');

        DB::table('aulas')->whereNull('palavra_geradora')->update(['palavra_geradora' => '']);

        Schema::table('aulas', function (Blueprint $table) {
            $table->string('palavra_geradora', 40)->nullable(false)->change();
        });

        Schema::table('aulas', function (Blueprint $table) {
            $table->dropIndex(['disciplina']);
            $table->dropColumn(['disciplina', 'rotulo', 'descricao', 'habilidade_bncc']);
        });
    }

    /** Toda aula de Português sem atividades recebe a sequência legada. Idempotente. */
    public function preencherAtividadesLegadas(): void
    {
        $agora = now();

        $ids = DB::table('aulas')
            ->where('disciplina', 'portugues')
            ->whereNotExists(fn ($q) => $q->select(DB::raw(1))
                ->from('aula_atividades')
                ->whereColumn('aula_atividades.aula_id', 'aulas.id'))
            ->pluck('id');

        foreach ($ids as $aulaId) {
            $linhas = [];

            foreach (self::LEGADO_PORTUGUES as $posicao => $tipo) {
                $linhas[] = [
                    'aula_id' => $aulaId,
                    'ordem' => $posicao + 1,
                    'tipo' => $tipo,
                    'config' => '{}',
                    'created_at' => $agora,
                    'updated_at' => $agora,
                ];
            }

            DB::table('aula_atividades')->insert($linhas);
        }
    }
};
