<?php

use App\Models\Crianca;
use App\Models\Gravacao;
use Illuminate\Support\Facades\Storage;

/*
| Purga de áudios (LGPD): apaga do disco privado o que foi recusado ou removido
| há mais de N dias e tudo o que é de criança excluída. O resto fica.
*/

function gravacaoNoDisco(Crianca $crianca, string $nome, array $extra = []): Gravacao
{
    Storage::disk('local')->put("mini-aulas/{$crianca->id}/{$nome}", 'audio');

    return Gravacao::create([
        'crianca_id' => $crianca->id, 'alvo_tipo' => 'mini_aula', 'arquivo_path' => "mini-aulas/{$crianca->id}/{$nome}",
        'status' => Gravacao::APROVADA, ...$extra,
    ]);
}

it('apaga recusadas e removidas com mais de 7 dias e as de crianças excluídas; mantém o resto', function () {
    Storage::fake('local');
    $crianca = Crianca::factory()->create();
    $excluida = Crianca::factory()->create();

    $recusadaVelha = gravacaoNoDisco($crianca, 'recusada-velha.webm', ['status' => Gravacao::RECUSADA]);
    Gravacao::where('id', $recusadaVelha->id)->update(['updated_at' => now()->subDays(8)]);

    $recusadaNova = gravacaoNoDisco($crianca, 'recusada-nova.webm', ['status' => Gravacao::RECUSADA]);

    $removidaVelha = gravacaoNoDisco($crianca, 'removida-velha.webm');
    $removidaVelha->delete();
    Gravacao::withTrashed()->where('id', $removidaVelha->id)->update(['deleted_at' => now()->subDays(9)]);

    $removidaNova = gravacaoNoDisco($crianca, 'removida-nova.webm');
    $removidaNova->delete();

    $aprovada = gravacaoNoDisco($crianca, 'aprovada.webm');
    $daExcluida = gravacaoNoDisco($excluida, 'da-excluida.webm');
    $excluida->delete();

    $this->artisan('teia:limpar-gravacoes')->expectsOutputToContain('Gravações apagadas: 3.')->assertSuccessful();

    Storage::disk('local')->assertMissing($recusadaVelha->arquivo_path);
    Storage::disk('local')->assertMissing($removidaVelha->arquivo_path);
    Storage::disk('local')->assertMissing($daExcluida->arquivo_path);
    Storage::disk('local')->assertExists($recusadaNova->arquivo_path);
    Storage::disk('local')->assertExists($removidaNova->arquivo_path);
    Storage::disk('local')->assertExists($aprovada->arquivo_path);

    expect(Gravacao::withTrashed()->pluck('id')->sort()->values()->all())
        ->toBe(collect([$recusadaNova->id, $removidaNova->id, $aprovada->id])->sort()->values()->all());

    // Com --dias=0 as novas também vão.
    $this->artisan('teia:limpar-gravacoes', ['--dias' => 0])->expectsOutputToContain('Gravações apagadas: 2.')->assertSuccessful();
    Storage::disk('local')->assertExists($aprovada->arquivo_path);
});
