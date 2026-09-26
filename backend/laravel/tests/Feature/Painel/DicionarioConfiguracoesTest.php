<?php

use App\Models\Configuracao;
use App\Models\Palavra;
use App\Models\User;

beforeEach(function () {
    $this->educador = User::factory()->create();
});

it('cadastra palavra com sílabas automáticas e aprovada', function () {
    $this->comoAdulto($this->educador)->postJson('/api/painel/dicionario', ['palavra' => 'cavalo'])
        ->assertCreated()
        ->assertJsonPath('palavra', 'CAVALO')
        ->assertJsonPath('silabas', ['CA', 'VA', 'LO'])
        ->assertJsonPath('origem', 'cms')
        ->assertJsonPath('aprovada', true);
});

it('não duplica palavra, mesmo com acento diferente', function () {
    Palavra::create(['palavra' => 'BONÉ', 'silabas' => ['BO', 'NÉ'], 'aprovada' => true]);

    $this->comoAdulto($this->educador)->postJson('/api/painel/dicionario', ['palavra' => 'bone'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('palavra');
});

it('importa várias palavras e explica as ignoradas', function () {
    Palavra::create(['palavra' => 'CASA', 'silabas' => ['CA', 'SA'], 'aprovada' => true]);

    $this->comoAdulto($this->educador)->postJson('/api/painel/dicionario/importar', [
        'texto' => "BOLA BO-LA\nCASA CA-SA\nSAPO\nPATO PA-TA\nDUAS PALAVRAS AQUI\n\n",
    ])
        ->assertOk()
        ->assertJsonPath('importadas', 2)
        ->assertJsonCount(3, 'ignoradas')
        ->assertJsonPath('ignoradas.0.linha', 'CASA CA-SA')
        ->assertJsonPath('ignoradas.0.motivo', 'Já está no dicionário.');

    expect(Palavra::where('palavra', 'SAPO')->value('silabas'))->toBe(['SA', 'PO']);
});

it('busca sem acento e filtra por aprovação', function () {
    Palavra::create(['palavra' => 'BONÉ', 'silabas' => ['BO', 'NÉ'], 'aprovada' => true]);
    Palavra::create(['palavra' => 'BONECA', 'silabas' => ['BO', 'NE', 'CA'], 'aprovada' => false]);
    Palavra::create(['palavra' => 'SAPO', 'silabas' => ['SA', 'PO'], 'aprovada' => true]);

    $this->comoAdulto($this->educador)->getJson('/api/painel/dicionario?busca=boné')
        ->assertOk()->assertJsonCount(2);

    $this->comoAdulto($this->educador)->getJson('/api/painel/dicionario?busca=bon&aprovada=0')
        ->assertOk()->assertJsonCount(1)->assertJsonPath('0.palavra', 'BONECA');
});

it('aprova e desaprova palavra', function () {
    $palavra = Palavra::create(['palavra' => 'PIPA', 'silabas' => ['PI', 'PA'], 'origem' => 'sugestao', 'aprovada' => false]);

    $this->comoAdulto($this->educador)->putJson("/api/painel/dicionario/{$palavra->id}", [
        'palavra' => 'PIPA', 'silabas' => ['PI', 'PA'], 'aprovada' => true,
    ])->assertOk()->assertJsonPath('aprovada', true)->assertJsonPath('aprovada_em', fn ($v) => $v !== null);

    expect($palavra->fresh()->aprovada_por_user_id)->toBe($this->educador->id);
});

it('lê e grava configurações', function () {
    $this->comoAdulto($this->educador)->getJson('/api/painel/configuracoes')
        ->assertOk()
        ->assertJsonPath('minutos_pausa', 20)
        ->assertJsonPath('consentimento_versao', 'v1');

    $this->comoAdulto($this->educador)->putJson('/api/painel/configuracoes', [
        'heroi_nome' => 'Fio',
        'fabrica_nome' => 'Fábrica do Vento',
        'minutos_pausa' => 15,
        'consentimento_versao' => 'v2',
        'consentimento_texto' => 'Texto novo',
    ])->assertOk()->assertJsonPath('heroi_nome', 'Fio')->assertJsonPath('minutos_pausa', 15);

    expect(Configuracao::aplicarPlaceholders('{{heroi}} foi à {{fabrica}}'))->toBe('Fio foi à Fábrica do Vento');
});

it('valida o tempo de pausa', function () {
    $this->comoAdulto($this->educador)->putJson('/api/painel/configuracoes', [
        'heroi_nome' => 'Fio', 'fabrica_nome' => 'F', 'minutos_pausa' => 1,
        'consentimento_versao' => 'v1', 'consentimento_texto' => 'T',
    ])->assertStatus(422)->assertJsonValidationErrors('minutos_pausa');
});
