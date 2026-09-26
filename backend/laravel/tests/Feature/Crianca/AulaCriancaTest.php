<?php

use App\Models\Aula;
use App\Models\Configuracao;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\CriancaSilaba;
use App\Models\Evento;
use App\Models\Gravacao;
use App\Models\Palavra;
use App\Models\Silaba;
use App\Models\TeiaPalavra;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    semearConteudo();
    $this->crianca = Crianca::factory()->create();
    $this->teia = aulaDaPalavra('TEIA');
    $this->boneca = aulaDaPalavra('BONECA');
});

it('mapa mostra só missões publicadas com a primeira aberta', function () {
    $missoes = $this->comoCrianca($this->crianca)->getJson('/api/crianca/mapa')->assertOk()->json('missoes');

    expect(array_column($missoes, 'palavra_geradora'))->toBe(['TEIA', 'BONECA', 'PULO', 'MOLA', 'SALVA'])
        ->and(array_column($missoes, 'status'))->toBe(['disponivel', 'bloqueada', 'bloqueada', 'bloqueada', 'bloqueada']);
});

it('não abre missão trancada', function () {
    $this->comoCrianca($this->crianca)->getJson("/api/crianca/aulas/{$this->boneca->id}")->assertForbidden();
    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->boneca->id}/iniciar")->assertForbidden();
    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->boneca->id}/tentativas", ['silabas' => ['BO', 'CA']])->assertForbidden();
});

it('entrega a aula pronta para a criança', function () {
    Configuracao::definir('heroi_nome', 'Fio');

    $aula = $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->teia->id}/iniciar")->assertOk()->json();

    expect($aula['status'])->toBe('em_andamento')
        ->and($aula['etapa_atual'])->toBe(1)
        ->and($aula['etapas'])->toHaveCount(8)
        ->and($aula['historia'][0]['texto'])->toContain('Fio')->not->toContain('{{heroi}}')
        ->and(array_column($aula['palmas'], 'texto'))->toBe(['TEI', 'A'])
        ->and(array_column($aula['ficha'][0]['membros'], 'texto'))->toBe(['TA', 'TE', 'TI', 'TO', 'TU'])
        ->and(array_column($aula['metas'], 'palavra'))->toContain('TATU', 'TETO')
        ->and($aula['metas'][0]['encontrada'])->toBeFalse()
        ->and($aula['palavrinhas'])->toContain('O', 'TEM');

    // Peças: famílias da aula primeiro, sem repetir som; palma TEI também vira peça.
    $pecas = array_column($aula['pecas'], 'texto');
    expect($pecas)->toContain('TA', 'A', 'TEI')
        ->and(count($pecas))->toBe(count(array_unique($pecas)))
        ->and(collect($aula['pecas'])->every(fn ($p) => $p['da_aula']))->toBeTrue();

    expect(CriancaAula::where('crianca_id', $this->crianca->id)->value('status'))->toBe('em_andamento');
});

it('peças acumuladas de aulas anteriores aparecem depois das da aula', function () {
    progresso($this->crianca, $this->teia, CriancaAula::CONCLUIDA);

    $pecas = $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->boneca->id}/iniciar")->json('pecas');
    $textos = array_column($pecas, 'texto');

    expect($textos)->toContain('BA', 'CA', 'TA', 'A')
        ->and(array_search('BA', $textos))->toBeLessThan(array_search('TA', $textos))
        ->and(collect($pecas)->firstWhere('texto', 'TA')['da_aula'])->toBeFalse();
});

it('avança etapa por etapa, sem pular', function () {
    $url = "/api/crianca/aulas/{$this->teia->id}/etapas";

    $this->comoCrianca($this->crianca)->postJson("{$url}/1/concluir")->assertOk()->assertJsonPath('etapa_atual', 2);
    $this->comoCrianca($this->crianca)->postJson("{$url}/3/concluir")->assertStatus(422);
    $this->comoCrianca($this->crianca)->postJson("{$url}/2/concluir")->assertOk()->assertJsonPath('etapa_atual', 3);

    // Rever uma etapa anterior não faz voltar.
    $this->comoCrianca($this->crianca)->postJson("{$url}/1/concluir")->assertOk()->assertJsonPath('etapa_atual', 3);

    $this->comoCrianca($this->crianca)->postJson("{$url}/8/concluir")->assertStatus(422);

    expect(Evento::where('tipo', 'etapa_concluida')->count())->toBe(3);
});

it('palavra válida entra na Teia, dá estrela e a primeira conquista', function () {
    $resposta = $this->comoCrianca($this->crianca)
        ->postJson("/api/crianca/aulas/{$this->teia->id}/tentativas", ['silabas' => ['TA', 'TU']])
        ->assertOk()
        ->assertJsonPath('valida', true)
        ->assertJsonPath('palavra', 'TATU')
        ->assertJsonPath('nova_na_teia', true)
        ->assertJsonPath('teia_total', 1)
        ->assertJsonPath('estrelas', 1)
        ->assertJsonPath('conquistas.0.chave', 'primeira_palavra');

    expect($resposta->json('dica'))->toBeNull();

    // Repetir não duplica nem dá estrela de novo.
    $this->comoCrianca($this->crianca)
        ->postJson("/api/crianca/aulas/{$this->teia->id}/tentativas", ['silabas' => ['TA', 'TU']])
        ->assertJsonPath('valida', true)
        ->assertJsonPath('nova_na_teia', false)
        ->assertJsonPath('estrelas', 1)
        ->assertJsonPath('conquistas', []);

    expect(TeiaPalavra::where('crianca_id', $this->crianca->id)->count())->toBe(1);
});

it('tentativa inválida vem com dica gentil e fica registrada', function () {
    $resposta = $this->comoCrianca($this->crianca)
        ->postJson("/api/crianca/aulas/{$this->teia->id}/tentativas", ['silabas' => ['TU', 'TO', 'TA']])
        ->assertOk()
        ->assertJsonPath('valida', false)
        ->assertJsonPath('estrelas', 0);

    expect($resposta->json('dica'))->not->toBeEmpty()
        ->and(mb_strtolower($resposta->json('dica')))->not->toContain('errad')
        ->and(Evento::where('tipo', 'tentativa_invalida')->exists())->toBeTrue();
});

it('conta o uso das sílabas e marca como dominada após 3 palavras', function () {
    Palavra::create(['palavra' => 'TITIO', 'silabas' => ['TI', 'TI', 'O'], 'aprovada' => true]);
    $url = "/api/crianca/aulas/{$this->teia->id}/tentativas";

    foreach ([['TI', 'A'], ['TI', 'O'], ['TI', 'TI', 'O']] as $silabas) {
        $this->comoCrianca($this->crianca)->postJson($url, ['silabas' => $silabas])->assertJsonPath('valida', true);
    }

    $ti = CriancaSilaba::where('crianca_id', $this->crianca->id)
        ->where('silaba_id', Silaba::where('texto', 'TI')->value('id'))
        ->first();

    expect($ti->vezes_usada)->toBe(3)->and($ti->dominada_em)->not->toBeNull();
});

it('produção aceita palavras da Teia e palavrinhas', function () {
    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->teia->id}/tentativas", ['silabas' => ['TA', 'TU']]);

    $this->comoCrianca($this->crianca)
        ->postJson("/api/crianca/aulas/{$this->teia->id}/producao", ['palavras' => ['O', 'TATU']])
        ->assertOk()
        ->assertJsonPath('texto', 'O TATU')
        ->assertJsonPath('estrelas', 2)
        ->assertJsonPath('conquistas.0.chave', 'primeira_frase');

    $this->comoCrianca($this->crianca)
        ->postJson("/api/crianca/aulas/{$this->teia->id}/producao", ['palavras' => ['TATU']])
        ->assertStatus(422);

    $this->comoCrianca($this->crianca)
        ->postJson("/api/crianca/aulas/{$this->teia->id}/producao", ['palavras' => ['O', 'DINOSSAURO']])
        ->assertStatus(422);
});

it('só conclui a missão depois da última etapa, e concluir de novo não dá estrela extra', function () {
    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->teia->id}/concluir")->assertStatus(422);

    CriancaAula::where('crianca_id', $this->crianca->id)->update(['etapa_atual' => 8]);

    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->teia->id}/concluir")
        ->assertOk()
        ->assertJsonPath('desbloqueadas.0.palavra_geradora', 'BONECA')
        ->assertJsonPath('estrelas', 3)
        ->assertJsonPath('conquistas.0.chave', 'missao_1');

    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->teia->id}/concluir")
        ->assertOk()
        ->assertJsonPath('desbloqueadas', [])
        ->assertJsonPath('estrelas', 3);
});

it('usa o áudio da aula e, se houver, a gravação aprovada da mesma turma', function () {
    $tatu = $this->teia->palavras()->where('palavra', 'TATU')->first();
    $tatu->update(['audio_path' => 'aulas/1/tatu.mp3']);

    $meta = fn () => collect($this->comoCrianca($this->crianca)->getJson("/api/crianca/aulas/{$this->teia->id}")->json('metas'))
        ->firstWhere('palavra', 'TATU');

    // Sem gravação, ainda trancada? Não: TEIA está disponível.
    expect($meta()['audio_url'])->toContain('/storage/aulas/1/tatu.mp3');

    $colega = Crianca::factory()->for($this->crianca->turma)->create();
    $gravacao = Gravacao::create([
        'crianca_id' => $colega->id,
        'alvo_tipo' => 'palavra',
        'alvo_id' => Palavra::where('palavra_normalizada', 'TATU')->value('id'),
        'arquivo_path' => 'gravacoes/x/tatu.webm',
        'status' => Gravacao::APROVADA,
        'revisada_em' => now(),
    ]);

    expect($meta()['audio_url'])->toBe("/api/crianca-proxy/audios/{$gravacao->id}");

    // Gravação de criança de OUTRA turma nunca é usada.
    $gravacao->update(['crianca_id' => Crianca::factory()->create()->id]);
    expect($meta()['audio_url'])->toContain('/storage/aulas/1/tatu.mp3');
});

it('mostra a Teia da criança, mais recentes primeiro', function () {
    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->teia->id}/tentativas", ['silabas' => ['TA', 'TU']]);
    $this->travel(1)->minutes();
    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$this->teia->id}/tentativas", ['silabas' => ['TE', 'TO']]);

    $this->comoCrianca($this->crianca)->getJson('/api/crianca/teia')
        ->assertOk()
        ->assertJsonPath('total', 2)
        ->assertJsonPath('palavras.0.palavra', 'TETO')
        ->assertJsonPath('palavras.1.aula.id', $this->teia->id);
});

it('sugere pausa uma única vez quando passa do tempo', function () {
    Configuracao::definir('minutos_pausa', '20');

    $primeiro = $this->comoCrianca($this->crianca)->postJson('/api/crianca/sessao/pulso')->assertOk()->json();
    expect($primeiro['sugerir_pausa'])->toBeFalse();

    foreach (range(1, 20) as $minuto) {
        $this->travel(1)->minutes();
        $pulso = $this->comoCrianca($this->crianca)->postJson('/api/crianca/sessao/pulso')->json();

        expect($pulso['sessao_id'])->toBe($primeiro['sessao_id'])
            ->and($pulso['sugerir_pausa'])->toBe($minuto === 20);
    }

    $this->travel(1)->minutes();
    expect($this->comoCrianca($this->crianca)->postJson('/api/crianca/sessao/pulso')->json('sugerir_pausa'))->toBeFalse();
});

it('abre sessão nova depois de 10 minutos parada', function () {
    $antes = $this->comoCrianca($this->crianca)->postJson('/api/crianca/sessao/pulso')->json('sessao_id');
    $this->travel(11)->minutes();
    $depois = $this->comoCrianca($this->crianca)->postJson('/api/crianca/sessao/pulso')->json('sessao_id');

    expect($depois)->not->toBe($antes);
});

it('serve gravação aprovada só para a mesma turma', function () {
    Storage::fake('local');
    Storage::disk('local')->put('gravacoes/1/tatu.webm', 'audio');

    $colega = Crianca::factory()->for($this->crianca->turma)->create();
    $gravacao = Gravacao::create([
        'crianca_id' => $colega->id, 'alvo_tipo' => 'palavra', 'alvo_id' => 1,
        'arquivo_path' => 'gravacoes/1/tatu.webm', 'status' => Gravacao::APROVADA,
    ]);

    $this->comoCrianca($this->crianca)->get("/api/crianca/audios/{$gravacao->id}")
        ->assertOk()
        ->assertHeader('Content-Type', 'audio/webm');

    $this->comoCrianca(Crianca::factory()->create())->get("/api/crianca/audios/{$gravacao->id}")->assertNotFound();

    $gravacao->update(['status' => Gravacao::PENDENTE]);
    $this->comoCrianca($this->crianca)->get("/api/crianca/audios/{$gravacao->id}")->assertNotFound();
});
