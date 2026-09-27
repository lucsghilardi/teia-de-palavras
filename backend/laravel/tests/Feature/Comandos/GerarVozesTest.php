<?php

use App\Services\Voz\VozService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

/*
| teia:gerar-vozes aquece a voz neural do conteúdo: idempotente, respeita o
| orçamento e avisa quando o provedor está desligado.
*/

beforeEach(function () {
    Storage::fake('local');
    Http::fake(['texttospeech.googleapis.com/*' => Http::response(['audioContent' => base64_encode('MP3-FALSO')])]);
});

it('gera todas as frases do conteúdo uma vez e não repete na segunda execução', function () {
    semearConteudo();
    config(['teia.voz.provedor' => 'google', 'teia.voz.chave' => 'chave-teste']);

    $this->artisan('teia:gerar-vozes')->assertSuccessful()->expectsOutputToContain('Vozes geradas:');

    $geradas = count(Storage::disk('local')->allFiles());
    expect($geradas)->toBeGreaterThan(50);
    Http::assertSentCount($geradas);
    expect(app(VozService::class)->existente('Toque na resposta certa.'))->not->toBeNull();

    $this->artisan('teia:gerar-vozes')->assertSuccessful()->expectsOutputToContain('Faltam 0 frases');
    Http::assertSentCount($geradas);
});

it('aceita frases extras de um arquivo e para quando o orçamento do mês acaba', function () {
    config(['teia.voz.provedor' => 'google', 'teia.voz.chave' => 'chave-teste', 'teia.voz.limite_mensal_chars' => 12]);
    $arquivo = tempnam(sys_get_temp_dir(), 'vozes');
    file_put_contents($arquivo, "Oi, tudo bem?\n\n  vamos brincar  \n");

    $this->artisan('teia:gerar-vozes', ['--arquivo' => $arquivo])
        ->assertSuccessful()
        ->expectsOutputToContain('Orçamento mensal de caracteres esgotado');

    // Só o que coube em 12 caracteres foi gerado; nada além disso foi pedido ao Google.
    expect(VozService::usoDoMes())->toBeLessThanOrEqual(12)
        ->and(count(Storage::disk('local')->allFiles()))->toBeGreaterThan(0);
    unlink($arquivo);
});

it('avisa e sai sem gerar quando o provedor está desligado; --so-contar funciona mesmo assim', function () {
    semearConteudo();

    $this->artisan('teia:gerar-vozes')->assertExitCode(2)->expectsOutputToContain('desativada');
    $this->artisan('teia:gerar-vozes', ['--so-contar' => true])->assertSuccessful()->expectsOutputToContain('Faltam');
    Http::assertNothingSent();
    expect(Storage::disk('local')->allFiles())->toBe([]);
});
