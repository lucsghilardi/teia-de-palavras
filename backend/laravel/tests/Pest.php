<?php

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaAula;
use Database\Seeders\ConfiguracoesSeeder;
use Database\Seeders\ConteudoGeografiaSeeder;
use Database\Seeders\ConteudoHistoriaSeeder;
use Database\Seeders\ConteudoInicialSeeder;
use Database\Seeders\ConteudoMatematicaSeeder;
use Database\Seeders\DicionarioSeeder;
use Database\Seeders\OpcoesVisuaisSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/*
| Todos os testes (Feature e Unit) usam o Tests\TestCase do Laravel e recriam o
| banco (PostgreSQL teia_test) a cada teste.
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature', 'Unit');

/** Semeia avatares, configurações, dicionário e as missões dos quatro planetas. */
function semearConteudo(): void
{
    test()->seed([
        OpcoesVisuaisSeeder::class,
        ConfiguracoesSeeder::class,
        DicionarioSeeder::class,
        ConteudoInicialSeeder::class,
        ConteudoMatematicaSeeder::class,
        ConteudoGeografiaSeeder::class,
        ConteudoHistoriaSeeder::class,
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
            // Concluída = tela de conquista, a "etapa" N+1 (N atividades).
            'etapa_atual' => $status === CriancaAula::CONCLUIDA ? $aula->atividades()->count() + 1 : 1,
            'iniciada_em' => now(),
            'concluida_em' => $status === CriancaAula::CONCLUIDA ? now() : null,
        ],
    );
}

/** PNG real de 1×1 (sem depender da extensão GD), para testes de upload. */
function pngFalso(string $nome): UploadedFile
{
    return UploadedFile::fake()->createWithContent($nome, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='));
}
