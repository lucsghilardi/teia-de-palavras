<?php

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use Database\Seeders\ConfiguracoesSeeder;
use Database\Seeders\ConteudoInicialSeeder;
use Database\Seeders\DicionarioSeeder;
use Database\Seeders\OpcoesVisuaisSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
| Todos os testes (Feature e Unit) usam o Tests\TestCase do Laravel e recriam o
| banco (PostgreSQL teia_test) a cada teste.
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature', 'Unit');

/** Semeia avatares, configurações, dicionário e as 10 missões do escopo. */
function semearConteudo(): void
{
    test()->seed([
        OpcoesVisuaisSeeder::class,
        ConfiguracoesSeeder::class,
        DicionarioSeeder::class,
        ConteudoInicialSeeder::class,
    ]);
}

function aulaDaPalavra(string $palavra): Aula
{
    return Aula::where('palavra_geradora', $palavra)->firstOrFail();
}

/** Coloca a criança numa situação de progresso sem passar pela API. */
function progresso(Crianca $crianca, Aula $aula, string $status): void
{
    CriancaAula::updateOrCreate(
        ['crianca_id' => $crianca->id, 'aula_id' => $aula->id],
        [
            'status' => $status,
            'etapa_atual' => $status === CriancaAula::CONCLUIDA ? 8 : 1,
            'iniciada_em' => now(),
            'concluida_em' => $status === CriancaAula::CONCLUIDA ? now() : null,
        ],
    );
}
