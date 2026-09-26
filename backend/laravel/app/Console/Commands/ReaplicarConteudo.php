<?php

namespace App\Console\Commands;

use App\Models\Aula;
use App\Services\Conteudo\AplicadorConteudo;
use Database\Seeders\ConteudoGeografiaSeeder;
use Database\Seeders\ConteudoHistoriaSeeder;
use Database\Seeders\ConteudoInicialSeeder;
use Database\Seeders\ConteudoMatematicaSeeder;
use Illuminate\Console\Command;

/**
 * Reaplica as missões semeadas num banco que já existe. Os seeders nunca
 * tocam numa aula que já existe (para não apagar edições do CMS); este
 * comando, com --forcar, sobrescreve história, palavras e atividades pelo
 * conteúdo atual do código. Sem --forcar só lista o que existe e o que falta.
 */
class ReaplicarConteudo extends Command
{
    protected $signature = 'teia:reaplicar-conteudo
        {--slug=* : Só estas missões (slug)}
        {--todas : Todas as missões semeadas dos quatro planetas}
        {--forcar : Sobrescreve as que já existem (edições do CMS nessas missões são perdidas)}';

    protected $description = 'Cria ou reaplica as missões dos seeders (Português, Matemática, Geografia, História)';

    public function handle(AplicadorConteudo $aplicador): int
    {
        $slugs = array_values(array_filter((array) $this->option('slug')));

        if ($slugs === [] && ! $this->option('todas')) {
            $this->error('Informe --slug=<slug> (pode repetir) ou --todas.');

            return self::INVALID;
        }

        $forcar = (bool) $this->option('forcar');
        $filtro = fn (array $dados) => $slugs === [] || in_array($dados['slug'], $slugs, true);
        $listas = [
            ConteudoInicialSeeder::missoes(),
            ConteudoMatematicaSeeder::missoes(),
            ConteudoGeografiaSeeder::missoes(),
            ConteudoHistoriaSeeder::missoes(),
        ];
        $conhecidos = [];

        foreach ($listas as $missoes) {
            foreach ($missoes as $dados) {
                $conhecidos[] = $dados['slug'];

                if (! $filtro($dados)) {
                    continue;
                }

                $existe = Aula::where('slug', $dados['slug'])->exists();

                if ($existe && ! $forcar) {
                    $this->line("  = {$dados['slug']}: já existe (use --forcar para sobrescrever)");
                } elseif ($existe) {
                    $this->line("  ~ {$dados['slug']}: sobrescrita");
                } else {
                    $this->line("  + {$dados['slug']}: criada");
                }
            }

            $aplicador->aplicarLista($missoes, $forcar, $filtro);
        }

        foreach (array_diff($slugs, $conhecidos) as $desconhecido) {
            $this->warn("  ? {$desconhecido}: não é uma missão semeada");
        }

        $this->info('Pronto.');

        return self::SUCCESS;
    }
}
