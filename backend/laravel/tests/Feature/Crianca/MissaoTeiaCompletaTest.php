<?php

use App\Models\Crianca;
use App\Models\Turma;

/*
| Critério de aceite da Fase 2, pela API: uma criança entra com avatar +
| figura secreta e completa a missão TEIA do início ao fim.
| (O mesmo percurso, só com toques, é feito no navegador pelo Playwright.)
*/

it('completa a missão TEIA do início ao fim', function () {
    semearConteudo();
    $turma = Turma::factory()->create(['codigo' => 'CASA22']);
    $crianca = Crianca::factory()->for($turma)->create(['apelido' => 'Gugu']);

    // Entrada: turma → avatar → figura secreta.
    $this->getJson('/api/crianca/turma/CASA22')->assertOk()->assertJsonPath('criancas.0.id', $crianca->id);
    $token = $this->postJson('/api/crianca/login', [
        'codigo_turma' => 'CASA22', 'crianca_id' => $crianca->id, 'figura_chave' => 'estrela',
    ])->assertOk()->json('access_token');
    $comToken = fn () => $this->withHeader('Authorization', "Bearer {$token}");

    // Mapa → missão 1.
    $teiaId = $comToken()->getJson('/api/crianca/mapa')->json('missoes.0.id');
    $aula = $comToken()->postJson("/api/crianca/aulas/{$teiaId}/iniciar")->assertOk()->json();
    expect($aula['palavra_geradora'])->toBe('TEIA');

    // Etapas 1 a 5: missão, conversa, palavra, palmas, ficha.
    foreach (range(1, 5) as $etapa) {
        $comToken()->postJson("/api/crianca/aulas/{$teiaId}/etapas/{$etapa}/concluir")
            ->assertOk()->assertJsonPath('etapa_atual', $etapa + 1);
    }

    // Etapa 6: criação — monta as palavras da missão com as peças.
    foreach ($aula['metas'] as $meta) {
        $comToken()->postJson("/api/crianca/aulas/{$teiaId}/tentativas", ['silabas' => $meta['silabas']])
            ->assertOk()->assertJsonPath('valida', true);
    }
    $comToken()->postJson("/api/crianca/aulas/{$teiaId}/etapas/6/concluir")->assertJsonPath('etapa_atual', 7);

    // Etapa 7: produção — frase curta com palavras da Teia.
    $comToken()->postJson("/api/crianca/aulas/{$teiaId}/producao", ['palavras' => ['O', 'TATU', 'TEM', 'TETO']])
        ->assertOk()->assertJsonPath('texto', 'O TATU TEM TETO');
    $comToken()->postJson("/api/crianca/aulas/{$teiaId}/etapas/7/concluir")->assertJsonPath('etapa_atual', 8);

    // Etapa 8: conquista — próximo capítulo desbloqueado.
    $fim = $comToken()->postJson("/api/crianca/aulas/{$teiaId}/concluir")->assertOk()->json();

    expect($fim['desbloqueadas'][0]['palavra_geradora'])->toBe('BONECA')
        ->and(array_column($fim['palavras_da_missao'], 'palavra'))->toBe(['TEIA', 'TATU', 'TIA', 'TIO', 'TETO'])
        ->and($fim['estrelas'])->toBe(5 + 1 + 3);

    $mapa = $comToken()->getJson('/api/crianca/mapa')->json('missoes');
    expect($mapa[0]['status'])->toBe('concluida')->and($mapa[1]['status'])->toBe('disponivel');

    $comToken()->getJson('/api/crianca/teia')->assertJsonPath('total', 5);
    $comToken()->getJson('/api/crianca/eu')->assertJsonPath('teia_total', 5)->assertJsonPath('estrelas', 9);
});
