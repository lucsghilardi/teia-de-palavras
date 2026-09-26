<?php

use App\Models\Aula;
use App\Models\User;
use App\Services\Aulas\AtividadesPadrao;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->educador = User::factory()->create();
});

function criarAula(array $dados): array
{
    return test()->comoAdulto(test()->educador)
        ->postJson('/api/painel/aulas', ['titulo' => 'Missão', 'fase' => 1, ...$dados])
        ->assertCreated()
        ->json();
}

it('aula nova de Português já vem com a sequência legada de atividades', function () {
    $aula = criarAula(['palavra_geradora' => 'TEIA']);

    expect($aula['disciplina'])->toBe('portugues')
        ->and(array_column($aula['atividades'], 'tipo'))->toBe(AtividadesPadrao::PORTUGUES)
        ->and($aula['atividades'][5]['avaliada'])->toBeTrue()
        ->and($aula['atividades'][0]['config'])->toBe([]);

    $resumo = $this->comoAdulto($this->educador)->getJson('/api/painel/aulas')->assertOk()->json();

    expect($resumo[0]['totais']['atividades'])->toBe(7)
        ->and($resumo[0]['rotulo'])->toBe('TEIA');
});

it('cria aula de Matemática sem palavra geradora e sem atividades', function () {
    $aula = criarAula(['disciplina' => 'matematica', 'titulo' => 'Somar até 20', 'rotulo' => '7 + 5', 'habilidade_bncc' => 'EF02MA05']);

    expect($aula['disciplina'])->toBe('matematica')
        ->and($aula['palavra_geradora'])->toBeNull()
        ->and($aula['rotulo'])->toBe('7 + 5')
        ->and($aula['habilidade_bncc'])->toBe('EF02MA05')
        ->and($aula['atividades'])->toBe([])
        ->and($aula['silabas'])->toBe([]);

    expect($this->comoAdulto($this->educador)->getJson('/api/painel/aulas?disciplina=matematica')->json())->toHaveCount(1)
        ->and($this->comoAdulto($this->educador)->getJson('/api/painel/aulas?disciplina=portugues')->json())->toHaveCount(0);
});

it('recusa disciplina desconhecida e Português sem palavra geradora', function () {
    $this->comoAdulto($this->educador)->postJson('/api/painel/aulas', ['titulo' => 'X', 'fase' => 1, 'disciplina' => 'quimica'])
        ->assertStatus(422)->assertJsonValidationErrors('disciplina');

    $this->comoAdulto($this->educador)->postJson('/api/painel/aulas', ['titulo' => 'X', 'fase' => 1])
        ->assertStatus(422)->assertJsonValidationErrors('palavra_geradora');
});

it('salva atividades mantendo ids, reordenando, criando e apagando', function () {
    $aula = criarAula(['palavra_geradora' => 'TEIA']);
    $porTipo = collect($aula['atividades'])->keyBy('tipo');

    $salvo = $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", [
        'titulo' => $aula['titulo'],
        'palavra_geradora' => 'TEIA',
        'fase' => 1,
        'pre_requisito_aula_id' => null,
        'silabas' => [['texto' => 'TEI', 'familia' => ['TA', 'TE']], ['texto' => 'A', 'familia' => ['A']]],
        'historia_paginas' => [['texto' => 'Era uma vez']],
        'perguntas' => [],
        'palavras' => [['palavra' => 'TATU']],
        'atividades' => [
            ['id' => $porTipo['frase']['id'], 'tipo' => 'frase', 'titulo' => 'Escreva', 'config' => ['minimo' => 3]],
            ['id' => $porTipo['historia']['id'], 'tipo' => 'historia'],
            ['tipo' => 'montar_palavras', 'instrucao' => 'monte palavras novas'],
        ],
    ])->assertOk()->json();

    expect(array_column($salvo['atividades'], 'tipo'))->toBe(['frase', 'historia', 'montar_palavras'])
        ->and(array_column($salvo['atividades'], 'ordem'))->toBe([1, 2, 3])
        ->and($salvo['atividades'][0]['id'])->toBe($porTipo['frase']['id'])
        ->and($salvo['atividades'][0]['config'])->toBe(['minimo' => 3])
        ->and($salvo['atividades'][0]['titulo'])->toBe('Escreva')
        ->and($salvo['atividades'][1]['id'])->toBe($porTipo['historia']['id'])
        ->and($salvo['atividades'][2]['instrucao'])->toBe('monte palavras novas')
        ->and(Aula::find($aula['id'])->atividades()->count())->toBe(3);
});

it('recusa tipo desconhecido e config inválido', function () {
    $aula = criarAula(['disciplina' => 'historia']);
    $base = ['titulo' => 'História', 'fase' => 1, 'pre_requisito_aula_id' => null];

    $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", [...$base, 'atividades' => [['tipo' => 'foguete']]])
        ->assertStatus(422)->assertJsonValidationErrors('atividades.0.tipo');

    $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", [...$base, 'atividades' => [['tipo' => 'frase', 'config' => ['minimo' => 99]]]])
        ->assertStatus(422)->assertJsonValidationErrors('atividades.0.config');
});

it('aula de outra disciplina publica com ao menos uma atividade, sem material de Português', function () {
    $aula = criarAula(['disciplina' => 'matematica']);

    $this->comoAdulto($this->educador)->postJson("/api/painel/aulas/{$aula['id']}/publicar")
        ->assertStatus(422)
        ->assertJsonPath('message', fn ($m) => str_contains($m, 'atividade') && ! str_contains($m, 'sílaba'));

    $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", [
        'titulo' => 'Somar', 'fase' => 1, 'pre_requisito_aula_id' => null,
        'atividades' => [['tipo' => 'historia', 'titulo' => 'A base lunar']],
    ])->assertOk();

    $this->comoAdulto($this->educador)->postJson("/api/painel/aulas/{$aula['id']}/publicar")->assertOk()->assertJsonPath('status', 'publicada');

    // Publicada, não pode ficar sem atividades.
    $this->comoAdulto($this->educador)->putJson("/api/painel/aulas/{$aula['id']}", [
        'titulo' => 'Somar', 'fase' => 1, 'pre_requisito_aula_id' => null, 'atividades' => [],
    ])->assertStatus(422)->assertJsonValidationErrors('status');
});

it('só reordena aulas da mesma disciplina e fase', function () {
    $portugues = criarAula(['palavra_geradora' => 'TEIA']);
    $matematica = criarAula(['disciplina' => 'matematica']);

    $this->comoAdulto($this->educador)->putJson('/api/painel/aulas/reordenar', ['ordem' => [$matematica['id'], $portugues['id']]])
        ->assertStatus(422);
});

it('aceita imagem numa atividade', function () {
    Storage::fake('public');
    $aula = criarAula(['palavra_geradora' => 'TEIA']);

    $this->comoAdulto($this->educador)->post("/api/painel/aulas/{$aula['id']}/midia", [
        'alvo' => 'atividade_imagem',
        'alvo_id' => $aula['atividades'][0]['id'],
        'arquivo' => pngFalso('capa.png'),
    ], ['Accept' => 'application/json'])->assertOk();

    expect(Aula::find($aula['id'])->atividades()->first()->imagem_path)->not->toBeNull();
});
