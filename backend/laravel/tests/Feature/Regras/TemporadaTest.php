<?php

use App\Models\Aula;
use App\Models\Configuracao;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\CriancaResposta;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;

/*
| Temporada 1 ("A Gosma Comilona", docs/temporada-1.md): cenas desenhadas por
| chave, fecho de episódio (desfecho + gancho), o mascote {{mascote}} e a
| reaplicação de conteúdo que não apaga o histórico das crianças.
*/

beforeEach(fn () => semearConteudo());

const LOTE_1 = [
    'missao-2-a-boneca-perdida',
    'missao-3-o-pulo-certeiro',
    'matematica-2-contar-ate-100',
    'geografia-2-o-mapa-do-bairro',
    'historia-1-ontem-hoje-amanha',
];

it('as missões do Lote 1 têm capa, desfecho, gancho e cena em toda página da história', function () {
    foreach (LOTE_1 as $slug) {
        $aula = Aula::where('slug', $slug)->with(['historiaPaginas', 'atividades'])->firstOrFail();

        expect($aula->ilustracao)->not->toBeEmpty("{$slug} sem capa")
            ->and($aula->desfecho)->not->toBeEmpty("{$slug} sem desfecho")
            ->and($aula->gancho)->not->toBeEmpty("{$slug} sem gancho");

        $paginas = $aula->disciplina === 'portugues'
            ? $aula->historiaPaginas->pluck('ilustracao')->all()
            : array_column($aula->atividades->firstWhere('tipo', 'historia')->configArray()['paginas'], 'ilustracao');

        expect($paginas)->not->toBeEmpty()->each->not->toBeEmpty();
    }
});

it('a criança recebe capa, cenas, desfecho e gancho, com o nome do mascote no lugar de {{mascote}}', function () {
    Configuracao::definir('mascote_nome', 'Pipoco');
    $crianca = Crianca::factory()->create();
    $aula = Aula::where('slug', 'missao-3-o-pulo-certeiro')->firstOrFail();

    // A missão 3 só abre depois das duas primeiras.
    foreach (['missao-1-a-teia-do-bairro', 'missao-2-a-boneca-perdida'] as $anterior) {
        progresso($crianca, Aula::where('slug', $anterior)->firstOrFail(), CriancaAula::CONCLUIDA);
    }

    $json = $this->comoCrianca($crianca)->postJson("/api/crianca/aulas/{$aula->id}/iniciar")->assertOk()->json();
    $porTipo = collect($json['atividades'])->keyBy('tipo');

    expect($json['ilustracao'])->toBe('bip-pulo')
        ->and($json['desfecho'])->toContain('Pipoco')->not->toContain('{{')
        ->and($json['gancho'])->not->toBeEmpty()
        ->and(array_column($porTipo['historia']['paginas'], 'ilustracao'))->toBe(['gosma-aparece', 'gosma-arroto', 'bip-pulo'])
        ->and($porTipo['historia']['paginas'][2]['texto'])->toContain('Pipoco')
        ->and($porTipo['escolher_silaba']['ilustracao'])->toBe('gosma-arroto')
        ->and($porTipo['palavra']['ilustracao'])->toBeNull();

    $geografia = Aula::where('slug', 'geografia-2-o-mapa-do-bairro')->firstOrFail();
    $mapa = $this->comoCrianca($crianca)->getJson('/api/crianca/mapa')->assertOk()->json('missoes');

    expect(collect($mapa)->firstWhere('id', $geografia->id)['ilustracao'])->toBe('mapa-bairro');
});

it('o nome do mascote é configurável no painel e chega ao /eu da criança', function () {
    $educador = User::factory()->create();

    $this->comoAdulto($educador)->getJson('/api/painel/configuracoes')->assertOk()->assertJsonPath('mascote_nome', 'Bip');

    $this->comoAdulto($educador)->putJson('/api/painel/configuracoes', [
        'heroi_nome' => 'Teco',
        'fabrica_nome' => 'Fábrica Faz-de-Conta',
        'mascote_nome' => 'Faísca',
        'minutos_pausa' => 15,
        'consentimento_versao' => 'v1',
        'consentimento_texto' => 'Texto do consentimento.',
    ])->assertOk()->assertJsonPath('mascote_nome', 'Faísca');

    $this->comoCrianca(Crianca::factory()->create())->getJson('/api/crianca/eu')->assertOk()->assertJsonPath('config.mascote_nome', 'Faísca');
});

it('reaplicar com --forcar atualiza no lugar e mantém as respostas quando o tipo da posição não muda', function () {
    $crianca = Crianca::factory()->create();
    $aula = Aula::where('slug', 'matematica-1-somar-para-decolar')->firstOrFail();
    $escolha = $this->comoCrianca($crianca)->postJson("/api/crianca/aulas/{$aula->id}/iniciar")->assertOk()->json('atividades.4');
    $item = $escolha['itens'][0];
    $certa = collect($item['opcoes'])->firstWhere('texto', '7')['id'];

    $this->comoCrianca($crianca)
        ->postJson("/api/crianca/aulas/{$aula->id}/atividades/5/responder", ['item' => $item['id'], 'opcao' => $certa])
        ->assertOk()->assertJsonPath('correta', true);

    $idsAntes = $aula->atividades()->orderBy('ordem')->pluck('id')->all();
    $aula->update(['ilustracao' => null, 'desfecho' => 'Editado no CMS']);

    Artisan::call('teia:reaplicar-conteudo', ['--slug' => ['matematica-1-somar-para-decolar'], '--forcar' => true]);

    expect($aula->atividades()->orderBy('ordem')->pluck('id')->all())->toBe($idsAntes)
        ->and(CriancaResposta::where('crianca_id', $crianca->id)->count())->toBe(1)
        ->and($aula->fresh()->ilustracao)->toBe('capa-somar')
        ->and($aula->fresh()->desfecho)->toStartWith('Suprimentos conferidos');
});

it('o editor aceita a chave de uma cena e recusa chave malformada', function () {
    $educador = User::factory()->create();
    $aula = Aula::where('slug', 'historia-1-ontem-hoje-amanha')->with('atividades')->firstOrFail();
    $documento = fn (array $extra) => [
        'titulo' => $aula->titulo,
        'fase' => 1,
        'pre_requisito_aula_id' => null,
        'atividades' => $aula->atividades->map(fn ($a) => [
            'id' => $a->id, 'tipo' => $a->tipo, 'titulo' => $a->titulo, 'instrucao' => $a->instrucao, 'config' => $a->configArray(),
        ])->all(),
        ...$extra,
    ];

    $this->comoAdulto($educador)->putJson("/api/painel/aulas/{$aula->id}", $documento(['ilustracao' => 'Capa Nova!']))
        ->assertStatus(422)->assertJsonValidationErrors('ilustracao');

    $salvo = $this->comoAdulto($educador)
        ->putJson("/api/painel/aulas/{$aula->id}", $documento(['ilustracao' => 'diario-tempo', 'desfecho' => 'Fim!', 'gancho' => null]))
        ->assertOk()->json();

    // Atividade sem a chave `ilustracao` no documento mantém a que tinha.
    expect($salvo['ilustracao'])->toBe('diario-tempo')
        ->and($salvo['desfecho'])->toBe('Fim!')
        ->and($salvo['gancho'])->toBeNull()
        ->and(collect($salvo['atividades'])->firstWhere('tipo', 'escolha')['ilustracao'])->toBe('diario-tempo');
});
