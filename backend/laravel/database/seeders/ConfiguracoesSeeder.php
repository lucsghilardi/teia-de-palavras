<?php

namespace Database\Seeders;

use App\Models\Configuracao;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

/** Grava os valores padrão sem sobrescrever o que o educador já mudou. */
class ConfiguracoesSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Configuracao::PADROES as $chave => $valor) {
            Configuracao::firstOrCreate(['chave' => $chave], ['valor' => $valor]);
        }

        Cache::forget('configuracoes');
    }
}
