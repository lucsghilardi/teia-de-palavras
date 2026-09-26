<?php

namespace Database\Seeders;

use App\Models\Palavra;
use App\Services\Palavras\Silabador;
use App\Support\Texto;
use Illuminate\Database\Seeder;

/**
 * Dicionário geral: palavras do universo da criança que podem aparecer na
 * etapa de criação. Só vale se a criança já tiver as sílabas (famílias
 * acumuladas). As palavras das aulas entram pelo ConteudoInicialSeeder.
 */
class DicionarioSeeder extends Seeder
{
    public const PALAVRAS = [
        'ASA', 'BALA', 'BANANA', 'BATATA', 'BEBÊ', 'BICO', 'BOLA', 'BOLO', 'BOTA', 'BULE',
        'CABO', 'CAMELO', 'CANECA', 'CAPA', 'CASA', 'CAVALO', 'COCO', 'COLA', 'COPO', 'CANETA',
        'LATA', 'LOBO', 'LUA', 'LUVA', 'MACACO', 'MACA', 'MAPA', 'MATO', 'MENINA', 'MENINO',
        'MOTO', 'NAVE', 'NOVE', 'NUCA', 'OVO', 'PAPAI', 'PANELA', 'PATO', 'PELO', 'PENA',
        'PETECA', 'PIANO', 'PICOLÉ', 'PULA', 'SAPO', 'SAPATO', 'SELO', 'SINO', 'SOPA', 'SUCO',
        'TAPETE', 'TATU', 'TOMATE', 'TUBO', 'UVA', 'VACA', 'VELA', 'VIOLA', 'VOVÓ', 'VOVÔ',
    ];

    public function run(): void
    {
        foreach (self::PALAVRAS as $palavra) {
            $normalizada = Texto::normalizar($palavra);

            if (Palavra::where('palavra_normalizada', $normalizada)->exists()) {
                continue;
            }

            Palavra::create([
                'palavra' => $palavra,
                'silabas' => Silabador::separar($palavra),
                'origem' => 'seed',
                'aprovada' => true,
                'aprovada_em' => now(),
            ]);
        }
    }
}
