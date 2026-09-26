<?php

use App\Models\Aula;
use App\Models\AulaHistoriaPagina;
use App\Models\Palavra;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->educador = User::factory()->create();
});

function criarAulaPelaApi(string $palavra = 'TEIA'): array
{
    return test()->comoAdulto(test()->educador)
        ->postJson('/api/painel/aulas', ['titulo' => "Missão {$palavra}", 'palavra_geradora' => $palavra, 'fase' => 1])
        ->assertCreated()
        ->json();
}

function documento(array $aula, array $extra = []): array
{
    return [
        'titulo' => $aula['titulo'],
        'palavra_geradora' => $aula['palavra_geradora'],
        'fase' => $aula['fase'],
        'pre_requisito_aula_id' => $aula['pre_requisito_aula_id'],
        'silabas' => array_map(fn ($s) => ['texto' => $s['texto'], 'familia' => array_column($s['familia'], 'texto')], $aula['silabas']),
        'historia_paginas' => array_map(fn ($p) => ['id' => $p['id'], 'texto' => $p['texto']], $aula['historia_paginas']),
        'perguntas' => array_map(fn ($p) => ['id' => $p['id'], 'texto' => $p['texto']], $aula['perguntas']),
        'palavras' => array_map(fn ($p) => ['id' => $p['id'], 'palavra' => $p['palavra'], 'silabas' => $p['silabas'], 'destaque' => $p['destaque']], $aula['palavras']),
        ...$extra,
    ];
}

it('cria aula em rascunho com sílabas e famílias sugeridas', function () {
    $aula = criarAulaPelaApi('boneca');

    expect($aula['status'])->toBe('rascunho')
        ->and($aula['palavra_geradora'])->toBe('BONECA')
        ->and(array_column($aula['silabas'], 'texto'))->toBe(['BO', 'NE', 'CA'])
        ->and(array_column($aula['silabas'][2]['familia'], 'texto'))->toBe(['CA', 'CO', 'CU'])
        ->and($aula['slug'])->toBe('missao-boneca');
});

it('salva o documento inteiro e devolve ids dos filhos', function () {
    $aula = criarAulaPelaApi();

    $salvo = $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", documento($aula, [
        'silabas' => [
            ['texto' => 'TEI', 'familia' => ['TA', 'TE', 'TI', 'TO', 'TU']],
            ['texto' => 'A', 'familia' => ['A', 'E', 'I', 'O', 'U']],
        ],
        'historia_paginas' => [['texto' => 'Página 1'], ['texto' => 'Página 2']],
        'perguntas' => [['texto' => 'Quem ajuda o bairro?']],
        'palavras' => [
            ['palavra' => 'tatu', 'silabas' => ['ta', 'tu'], 'destaque' => true],
            ['palavra' => 'TIA', 'silabas' => []],
        ],
    ]))->assertOk()->json();

    expect(array_column($salvo['historia_paginas'], 'texto'))->toBe(['Página 1', 'Página 2'])
        ->and($salvo['historia_paginas'][0]['id'])->toBeInt()
        ->and(array_column($salvo['palavras'], 'palavra'))->toBe(['TATU', 'TIA'])
        ->and($salvo['palavras'][1]['silabas'])->toBe(['TI', 'A'])
        ->and($salvo['palavras'][0]['destaque'])->toBeTrue();

    // Palavras da aula também entram no dicionário geral, aprovadas.
    expect(Palavra::where('palavra_normalizada', 'TIA')->value('aprovada'))->toBeTrue();
});

it('mantém o id (e a mídia) de página editada e apaga a removida', function () {
    Storage::fake('public');
    $aula = criarAulaPelaApi();
    $salvo = $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", documento($aula, [
        'historia_paginas' => [['texto' => 'Um'], ['texto' => 'Dois']],
    ]))->json();

    [$um, $dois] = $salvo['historia_paginas'];

    $this->comoAdulto($this->educador)->post("/api/painel/aulas/{$aula['id']}/midia", [
        'alvo' => 'pagina_imagem',
        'alvo_id' => $dois['id'],
        'arquivo' => pngFalso('dois.png'),
    ], ['Accept' => 'application/json'])->assertOk();

    $path = AulaHistoriaPagina::find($dois['id'])->imagem_path;
    Storage::disk('public')->assertExists($path);

    $final = $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", documento($salvo, [
        'historia_paginas' => [['id' => $dois['id'], 'texto' => 'Dois editado']],
    ]))->assertOk()->json();

    expect($final['historia_paginas'])->toHaveCount(1)
        ->and($final['historia_paginas'][0]['id'])->toBe($dois['id'])
        ->and($final['historia_paginas'][0]['texto'])->toBe('Dois editado')
        ->and($final['historia_paginas'][0]['imagem_url'])->not->toBeNull()
        ->and(AulaHistoriaPagina::find($um['id']))->toBeNull();
});

it('recusa sílabas que não formam a palavra geradora', function () {
    $aula = criarAulaPelaApi();

    $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", documento($aula, [
        'silabas' => [['texto' => 'TE', 'familia' => []], ['texto' => 'LA', 'familia' => []]],
    ]))->assertStatus(422)->assertJsonValidationErrors('silabas');
});

it('recusa palavra cujas sílabas não a formam, e palavra repetida', function () {
    $aula = criarAulaPelaApi();

    $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", documento($aula, [
        'palavras' => [['palavra' => 'TATU', 'silabas' => ['TA', 'TO']]],
    ]))->assertStatus(422);

    $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", documento($aula, [
        'palavras' => [['palavra' => 'BONÉ'], ['palavra' => 'BONE']],
    ]))->assertStatus(422);
});

it('só publica com sílaba, história e palavra', function () {
    $aula = criarAulaPelaApi();

    $this->comoAdulto($this->educador)->postJson("/api/painel/aulas/{$aula['id']}/publicar")
        ->assertStatus(422)
        ->assertJsonPath('message', fn ($m) => str_contains($m, 'história') && str_contains($m, 'palavra'));

    $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", documento($aula, [
        'historia_paginas' => [['texto' => 'Era uma vez']],
        'palavras' => [['palavra' => 'TATU']],
    ]))->assertOk();

    $this->comoAdulto($this->educador)->postJson("/api/painel/aulas/{$aula['id']}/publicar")
        ->assertOk()
        ->assertJsonPath('status', 'publicada');
});

it('aula publicada não pode ficar vazia; precisa despublicar antes', function () {
    $aula = criarAulaPelaApi();
    $cheia = $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", documento($aula, [
        'historia_paginas' => [['texto' => 'Era uma vez']],
        'palavras' => [['palavra' => 'TATU']],
    ]))->json();
    $this->comoAdulto($this->educador)->postJson("/api/painel/aulas/{$aula['id']}/publicar")->assertOk();

    $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", documento($cheia, [
        'palavras' => [],
    ]))->assertStatus(422)->assertJsonValidationErrors('status');
});

it('impede ciclo de pré-requisitos', function () {
    $a = criarAulaPelaApi('TEIA');
    $b = criarAulaPelaApi('PULO');

    expect($b['pre_requisito_aula_id'])->toBe($a['id']);

    $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$a['id']}", documento($a, [
        'pre_requisito_aula_id' => $b['id'],
    ]))->assertStatus(422)->assertJsonValidationErrors('pre_requisito_aula_id');

    $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$a['id']}", documento($a, [
        'pre_requisito_aula_id' => $a['id'],
    ]))->assertStatus(422);
});

it('reordena aulas da mesma fase', function () {
    $a = criarAulaPelaApi('TEIA');
    $b = criarAulaPelaApi('PULO');
    $c = criarAulaPelaApi('MOLA');

    $lista = $this->comoAdulto($this->educador)
        ->putJson('/api/painel/aulas/reordenar', ['ordem' => [$c['id'], $a['id'], $b['id']]])
        ->assertOk()
        ->json();

    expect(array_column($lista, 'palavra_geradora'))->toBe(['MOLA', 'TEIA', 'PULO']);
});

it('não reordena misturando fases', function () {
    $a = criarAulaPelaApi('TEIA');
    $b = $this->comoAdulto($this->educador)
        ->postJson('/api/painel/aulas', ['titulo' => 'Fase dois', 'palavra_geradora' => 'ARANHA', 'fase' => 2])
        ->json();

    $this->comoAdulto($this->educador)
        ->putJson('/api/painel/aulas/reordenar', ['ordem' => [$b['id'], $a['id']]])
        ->assertStatus(422);
});

it('envia e remove áudio da palavra geradora', function () {
    Storage::fake('public');
    $aula = criarAulaPelaApi();

    $url = $this->comoAdulto($this->educador)->post("/api/painel/aulas/{$aula['id']}/midia", [
        'alvo' => 'palavra_audio',
        'arquivo' => UploadedFile::fake()->create('teia.mp3', 40, 'audio/mpeg'),
    ], ['Accept' => 'application/json'])->assertOk()->json('url');

    expect($url)->toContain('/storage/aulas/');
    $path = Aula::find($aula['id'])->palavra_audio_path;
    Storage::disk('public')->assertExists($path);

    $this->comoAdulto($this->educador)->deleteJson("/api/painel/aulas/{$aula['id']}/midia", ['alvo' => 'palavra_audio'])
        ->assertNoContent();

    Storage::disk('public')->assertMissing($path);
    expect(Aula::find($aula['id'])->palavra_audio_path)->toBeNull();
});

it('recusa SVG e arquivo de tipo errado no upload', function () {
    Storage::fake('public');
    $aula = criarAulaPelaApi();

    $this->comoAdulto($this->educador)->post("/api/painel/aulas/{$aula['id']}/midia", [
        'alvo' => 'palavra_imagem',
        'arquivo' => UploadedFile::fake()->createWithContent('x.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
    ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('arquivo');
});

it('exige alvo_id de item da própria aula para mídia de página', function () {
    Storage::fake('public');
    $aula = criarAulaPelaApi();

    $this->comoAdulto($this->educador)->post("/api/painel/aulas/{$aula['id']}/midia", [
        'alvo' => 'pagina_imagem',
        'alvo_id' => 999999,
        'arquivo' => pngFalso('p.png'),
    ], ['Accept' => 'application/json'])->assertStatus(422)->assertJsonValidationErrors('alvo_id');
});

it('não apaga aula publicada', function () {
    $aula = criarAulaPelaApi();
    Aula::whereKey($aula['id'])->update(['status' => 'publicada']);

    $this->comoAdulto($this->educador)->deleteJson("/api/painel/aulas/{$aula['id']}")->assertStatus(422);
});

it('sugere família de uma sílaba', function () {
    $this->comoAdulto($this->educador)->postJson('/api/painel/silabas/sugerir-familia', ['silaba' => 'nha'])
        ->assertOk()
        ->assertJsonPath('familia', ['NHA', 'NHE', 'NHI', 'NHO', 'NHU']);
});

it('lista aulas com totais', function () {
    $aula = criarAulaPelaApi();

    $this->comoAdulto($this->educador)->getJson('/api/painel/aulas')
        ->assertOk()
        ->assertJsonPath('0.id', $aula['id'])
        ->assertJsonPath('0.totais.silabas', 2)
        ->assertJsonPath('0.totais.palavras', 0);
});
