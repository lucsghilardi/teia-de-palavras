<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /** Idempotente: pode rodar de novo sem duplicar nem apagar edições do CMS. */
    public function run(): void
    {
        $this->call([
            OpcoesVisuaisSeeder::class,
            ConfiguracoesSeeder::class,
            DicionarioSeeder::class,
            ConteudoInicialSeeder::class,
            ConteudoMatematicaSeeder::class,
        ]);

        if (app()->environment('local')) {
            $this->call(DemoSeeder::class);
        }
    }
}
