<?php

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaConquista;
use App\Models\CriancaEstatistica;
use App\Models\CriancaItem;
use App\Models\Gravacao;
use App\Models\MiniAula;
use App\Models\MiniAulaEntrega;
use App\Models\Turma;
use App\Models\TurmaAmizade;
use App\Models\User;
use App\Services\Amizades\AmizadeService;
use App\Services\MiniAulas\ModelosMiniAula;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/*
| Mini-aulas: Ana (turma A) grava um desafio → um adulto aprova → Beto (turma B,
| amiga) e Duda (turma A) recebem; Caio (turma C, sem amizade) nunca vê nada.
*/

beforeEach(function () {
    semearConteudo();
    Storage::fake('local');

    $this->paiA = User::factory()->create();
    $this->paiB = User::factory()->create();
    $this->turmaA = Turma::factory()->for($this->paiA, 'educador')->create(['nome' => 'Casa A']);
    $this->turmaB = Turma::factory()->for($this->paiB, 'educador')->create(['nome' => 'Casa B']);
    $this->turmaC = Turma::factory()->create(['nome' => 'Casa C']);

    $this->ana = Crianca::factory()->for($this->turmaA)->create(['apelido' => 'Ana']);
    $this->duda = Crianca::factory()->for($this->turmaA)->create(['apelido' => 'Duda']);
    $this->beto = Crianca::factory()->for($this->turmaB)->create(['apelido' => 'Beto']);
    $this->caio = Crianca::factory()->for($this->turmaC)->create(['apelido' => 'Caio']);

    $amizade = app(AmizadeService::class)->gerar($this->turmaA, $this->paiA);
    $this->amizade = app(AmizadeService::class)->aceitar($this->turmaB, $amizade->codigo, $this->paiB, true);

    $this->teia = aulaDaPalavra('TEIA');
});

function audioFalso(string $nome = 'aula.webm', int $kb = 40, string $mime = 'audio/webm'): UploadedFile
{
    return UploadedFile::fake()->create($nome, $kb, $mime);
}

/** Grava uma mini-aula pela API e devolve a resposta (201) como array. */
function gravarMiniAula(Crianca $autora, Aula $aula, ?string $modelo = null, int $semente = 0): array
{
    $modelo ??= test()->comoCrianca($autora)->getJson("/api/crianca/mini-aulas/modelos?aula_id={$aula->id}&semente={$semente}")->assertOk()->json('modelos.0.chave');

    return test()->comoCrianca($autora)->post('/api/crianca/mini-aulas', [
        'aula_id' => $aula->id, 'modelo' => $modelo, 'semente' => $semente, 'duracao_ms' => 12000, 'audio' => audioFalso(),
    ], ['Accept' => 'application/json'])->assertCreated()->json();
}

/** A resposta certa de uma mini-aula, lida do config guardado (a API nunca a entrega). */
function respostaCerta(MiniAula $mini): array
{
    $item = $mini->configArray()['itens'][0];

    return match ($mini->tipo) {
        'escolher_silaba' => ['item' => $item['id'], 'silaba' => $item['silabas'][$item['posicao'] ?? $item['oculta']]],
        'ditado' => ['item' => $item['id'], 'silabas' => $item['silabas']],
        default => throw new RuntimeException("sem resposta certa para {$mini->tipo}"),
    };
}

it('oferece até 3 modelos gerados da missão, sem a resposta, e "outro" (semente) sorteia diferente', function () {
    $json = $this->comoCrianca($this->ana)->getJson("/api/crianca/mini-aulas/modelos?aula_id={$this->teia->id}")->assertOk()->json();

    expect($json['aula']['rotulo'])->toBe('TEIA')
        ->and($json['limite_segundos'])->toBe(60)
        ->and($json['modelos'])->toHaveCount(3)
        ->and(collect($json['modelos'])->pluck('tipo')->unique()->sort()->values()->all())->toBe(['ditado', 'escolher_silaba'])
        ->and($json['modelos'][0])->toHaveKeys(['chave', 'tipo', 'titulo', 'fala'])
        ->and($json['modelos'][0])->not->toHaveKey('config');

    $outro = $this->comoCrianca($this->ana)->getJson("/api/crianca/mini-aulas/modelos?aula_id={$this->teia->id}&semente=3")->json('modelos');
    expect(collect($outro)->pluck('chave')->all())->not->toBe(collect($json['modelos'])->pluck('chave')->all());

    // Missão trancada: sem modelos, sem gravação.
    $boneca = aulaDaPalavra('BONECA');
    $this->comoCrianca($this->ana)->getJson("/api/crianca/mini-aulas/modelos?aula_id={$boneca->id}")->assertNotFound();
    $this->comoCrianca($this->ana)->post('/api/crianca/mini-aulas', ['aula_id' => $boneca->id, 'modelo' => 'silaba:BOCA', 'audio' => audioFalso()], ['Accept' => 'application/json'])->assertForbidden();
});

it('gera modelos de Matemática (fato ou contagem) e de Geografia/História (escolha, ordenar, parear) com config válido', function () {
    $modelos = app(ModelosMiniAula::class);
    $matematica = Aula::where('slug', 'matematica-1-somar-para-decolar')->with(['atividades', 'palavras'])->firstOrFail();
    $geografia = Aula::where('slug', 'geografia-1-minha-casa-e-minha-rua')->with(['atividades', 'palavras'])->firstOrFail();
    $historia = Aula::where('slug', 'historia-1-ontem-hoje-amanha')->with(['atividades', 'palavras'])->firstOrFail();

    foreach ([$matematica, $geografia, $historia] as $aula) {
        $lista = $modelos->para($this->ana, $aula);

        expect($lista)->not->toBeEmpty()->and(count($lista))->toBeLessThanOrEqual(3);

        foreach ($lista as $modelo) {
            $atividade = ModelosMiniAula::atividadeVirtual($modelo['tipo'], $modelo['config']);
            $config = $atividade->avaliador()->validarConfig($modelo['config']);

            expect($config)->toBeArray()
                ->and($modelos->resolver($this->ana, $aula, $modelo['chave']))->toBe($modelo)
                ->and(mb_strtolower($modelo['titulo'].' '.$modelo['fala']))->not->toMatch('/errad|incorret|ranking|\bnota\b(?! de )/');
        }
    }

    expect(collect($modelos->para($this->ana, $matematica))->pluck('tipo')->all())->toContain('somar_subtrair');
});

it('fluxo completo: Ana grava → adulto aprova → Beto (turma amiga) e Duda recebem, Caio não; Beto responde e reage; Ana ganha XP e medalhas', function () {
    $criada = gravarMiniAula($this->ana, $this->teia);
    $mini = MiniAula::findOrFail($criada['id']);

    expect($criada['status'])->toBe('pendente')
        ->and($criada['mensagem'])->toContain('adulto')
        ->and($mini->tipo)->toBe('escolher_silaba')
        ->and($mini->gravacao->status)->toBe(Gravacao::PENDENTE)
        ->and($mini->gravacao->alvo_tipo)->toBe('mini_aula')
        ->and($mini->gravacao->alvo_id)->toBe($mini->id)
        ->and($mini->gravacao->arquivo_path)->toStartWith("mini-aulas/{$this->ana->id}/");
    Storage::disk('local')->assertExists($mini->gravacao->arquivo_path);

    // Pendente: invisível para todo mundo (inclusive o áudio), e a autora vê "pendente" nas suas.
    $this->comoCrianca($this->beto)->getJson('/api/crianca/mini-aulas/recebidas')->assertOk()->assertJsonPath('novas', 0)->assertJsonPath('entregas', []);
    $this->comoCrianca($this->beto)->getJson('/api/crianca/galaxia')->assertJsonPath('amigos.novas', 0);
    $this->comoCrianca($this->beto)->get("/api/crianca/audios/{$mini->gravacao_id}")->assertNotFound();
    $this->comoCrianca($this->ana)->getJson('/api/crianca/mini-aulas/minhas')->assertJsonPath('mini_aulas.0.status', 'pendente')->assertJsonPath('mini_aulas.0.respondidas', 0);

    // Só o responsável da turma da autora (ou admin) aprova.
    $this->comoAdulto($this->paiB)->getJson('/api/painel/mini-aulas')->assertOk()->assertJsonCount(0);
    $this->comoAdulto($this->paiB)->postJson("/api/painel/mini-aulas/{$mini->id}/aprovar")->assertForbidden();

    $fila = $this->comoAdulto($this->paiA)->getJson('/api/painel/mini-aulas')->assertOk()->assertJsonCount(1)->json('0');
    expect($fila)->toMatchArray(['status' => 'pendente', 'tipo' => 'escolher_silaba', 'disciplina' => 'portugues', 'entregas' => 0])
        ->and($fila['autor']['apelido'])->toBe('Ana')
        ->and($fila['autor']['turma']['nome'])->toBe('Casa A')
        ->and($fila['aula_origem']['rotulo'])->toBe('TEIA')
        ->and($fila['audio_url'])->toBe("/painel/mini-aulas/{$mini->id}/audio")
        ->and($fila['duracao_ms'])->toBe(12000);
    $this->comoAdulto($this->paiA)->get("/api/painel/mini-aulas/{$mini->id}/audio")->assertOk()->assertHeader('Content-Type', 'audio/webm');
    $this->comoAdulto($this->paiB)->get("/api/painel/mini-aulas/{$mini->id}/audio")->assertForbidden();

    $aprovada = $this->comoAdulto($this->paiA)->postJson("/api/painel/mini-aulas/{$mini->id}/aprovar")->assertOk()->json();

    expect($aprovada['status'])->toBe('aprovada')
        ->and($aprovada['entregas'])->toBe(2) // Duda (mesma turma) + Beto (turma amiga); nunca a autora nem Caio
        ->and($mini->fresh()->gravacao->status)->toBe(Gravacao::APROVADA)
        ->and(MiniAulaEntrega::pluck('crianca_id')->sort()->values()->all())->toBe(collect([$this->duda->id, $this->beto->id])->sort()->values()->all())
        ->and(CriancaEstatistica::where('crianca_id', $this->ana->id)->value('xp_total'))->toBe(3)
        ->and(CriancaConquista::where('crianca_id', $this->ana->id)->pluck('chave')->all())->toBe(['professor_1']);

    // Beto recebe: apelido + avatar da autora, áudio pela rota autenticada; Caio não.
    $recebidas = $this->comoCrianca($this->beto)->getJson('/api/crianca/mini-aulas/recebidas')->assertOk()->assertJsonPath('novas', 1)->json();
    $entrega = $recebidas['entregas'][0];

    expect($entrega['status'])->toBe('recebida')
        ->and($entrega['mini_aula']['autor'])->toMatchArray(['apelido' => 'Ana'])
        ->and($entrega['mini_aula']['autor']['avatar']['chave'])->toBe('nave')
        ->and($entrega['mini_aula']['autor'])->not->toHaveKey('id')
        ->and($entrega['mini_aula']['audio_url'])->toBe("/api/crianca-proxy/audios/{$mini->gravacao_id}");
    $this->comoCrianca($this->beto)->getJson('/api/crianca/galaxia')->assertJsonPath('amigos.novas', 1);
    $this->comoCrianca($this->beto)->get("/api/crianca/audios/{$mini->gravacao_id}")->assertOk()->assertHeader('Content-Type', 'audio/webm');
    $this->comoCrianca($this->duda)->get("/api/crianca/audios/{$mini->gravacao_id}")->assertOk();
    $this->comoCrianca($this->caio)->get("/api/crianca/audios/{$mini->gravacao_id}")->assertNotFound();
    $this->comoCrianca($this->caio)->getJson('/api/crianca/mini-aulas/recebidas')->assertJsonPath('novas', 0);
    $this->comoCrianca($this->caio)->getJson("/api/crianca/mini-aulas/entregas/{$entrega['id']}")->assertNotFound();

    // Beto abre a mini-aula: a atividade vem montada sem a resposta.
    $aberta = $this->comoCrianca($this->beto)->getJson("/api/crianca/mini-aulas/entregas/{$entrega['id']}")->assertOk()->json();
    $item = $aberta['atividade']['itens'][0];
    $certa = respostaCerta($mini);
    $errada = collect($item['opcoes'])->first(fn ($o) => $o !== $certa['silaba']);

    expect($aberta['atividade'])->toMatchArray(['ordem' => 1, 'tipo' => 'escolher_silaba', 'avaliada' => true])
        ->and($item['pecas'])->toContain(null)
        ->and(json_encode($aberta))->not->toContain('"correta":"');

    $url = "/api/crianca/mini-aulas/entregas/{$entrega['id']}/responder";
    $primeiro = $this->comoCrianca($this->beto)->postJson($url, ['item' => $item['id'], 'silaba' => $errada])
        ->assertOk()->assertJsonPath('correta', false)->assertJsonPath('resolvido', false)->assertJsonPath('xp_ganho', 0)->assertJsonPath('resposta_correta', null)->json();
    expect(mb_strtolower($primeiro['mensagem'].' '.$primeiro['dica']))->not->toMatch('/errad|incorret/');

    $this->comoCrianca($this->beto)->postJson($url, $certa)
        ->assertOk()->assertJsonPath('correta', true)->assertJsonPath('resolvido', true)->assertJsonPath('xp_ganho', 1)->assertJsonPath('tentativas', 2);

    // Responder de novo não dá XP de novo (nem para a autora).
    $this->comoCrianca($this->beto)->postJson($url, $certa)->assertOk()->assertJsonPath('xp_ganho', 0);

    expect(CriancaEstatistica::where('crianca_id', $this->beto->id)->value('xp_total'))->toBe(1)
        ->and(CriancaConquista::where('crianca_id', $this->beto->id)->pluck('chave')->all())->toBe(['aluno_1'])
        ->and($mini->fresh()->xp_autora)->toBe(1)
        ->and(CriancaEstatistica::where('crianca_id', $this->ana->id)->value('xp_total'))->toBe(4)
        ->and(CriancaConquista::where('crianca_id', $this->ana->id)->pluck('chave')->sort()->values()->all())->toBe(['amigo_aprendeu', 'professor_1']);

    // Reação (sem texto livre) e o resumo da autora: quantos responderam, nunca quem foi melhor.
    $this->comoCrianca($this->beto)->postJson("/api/crianca/mini-aulas/entregas/{$entrega['id']}/reagir", ['reacao' => 'top'])->assertOk()->assertJsonPath('reacao', 'top');
    $this->comoCrianca($this->beto)->postJson("/api/crianca/mini-aulas/entregas/{$entrega['id']}/reagir", ['reacao' => 'qualquer coisa'])->assertUnprocessable();

    $minhas = $this->comoCrianca($this->ana)->getJson('/api/crianca/mini-aulas/minhas')->assertOk()->json('mini_aulas.0');
    expect($minhas)->toMatchArray(['status' => 'aprovada', 'respondidas' => 1, 'reacoes' => ['top' => 1]])
        ->and(json_encode($minhas))->not->toMatch('/ranking|apelido/');

    $recebidas = $this->comoCrianca($this->beto)->getJson('/api/crianca/mini-aulas/recebidas')->assertJsonPath('novas', 0)->json('entregas.0');
    expect($recebidas)->toMatchArray(['status' => 'respondida', 'correta' => true, 'reacao' => 'top']);

    // O painel mostra a aprovada com as contagens.
    $this->comoAdulto($this->paiA)->getJson('/api/painel/mini-aulas?status=aprovada')->assertJsonCount(1)->assertJsonPath('0.entregas', 2)->assertJsonPath('0.respondidas', 1);
});

it('no segundo erro mostra a resposta e agenda a revisão de quem respondeu', function () {
    $mini = MiniAula::findOrFail(gravarMiniAula($this->ana, $this->teia)['id']);
    $this->comoAdulto($this->paiA)->postJson("/api/painel/mini-aulas/{$mini->id}/aprovar")->assertOk();
    $entrega = MiniAulaEntrega::where('crianca_id', $this->beto->id)->firstOrFail();
    $certa = respostaCerta($mini);
    $url = "/api/crianca/mini-aulas/entregas/{$entrega->id}/responder";

    $this->comoCrianca($this->beto)->postJson($url, ['item' => $certa['item'], 'silaba' => 'XX'])->assertOk()->assertJsonPath('revisao_agendada', false);
    $segundo = $this->comoCrianca($this->beto)->postJson($url, ['item' => $certa['item'], 'silaba' => 'XX'])
        ->assertOk()
        ->assertJsonPath('correta', false)
        ->assertJsonPath('resolvido', true)
        ->assertJsonPath('revisao_agendada', true)
        ->assertJsonPath('xp_ganho', 0)
        ->json();

    expect($segundo['resposta_correta']['silaba'])->toBe($certa['silaba'])
        ->and($entrega->fresh())->toMatchArray(['status' => 'respondida', 'correta' => false, 'tentativas' => 2])
        ->and(CriancaItem::where('crianca_id', $this->beto->id)->where('chave', 'like', 'silaba:%')->exists())->toBeTrue()
        ->and($mini->fresh()->xp_autora)->toBe(0);
});

it('recusar apaga o áudio do disco, registra o motivo e nada chega às crianças', function () {
    $mini = MiniAula::findOrFail(gravarMiniAula($this->ana, $this->teia)['id']);
    $path = $mini->gravacao->arquivo_path;

    $this->comoAdulto($this->paiA)->postJson("/api/painel/mini-aulas/{$mini->id}/recusar", ['motivo' => 'Áudio cortado.'])
        ->assertOk()
        ->assertJsonPath('status', 'recusada')
        ->assertJsonPath('motivo_recusa', 'Áudio cortado.')
        ->assertJsonPath('audio_url', null);

    Storage::disk('local')->assertMissing($path);

    expect(Gravacao::find($mini->gravacao_id))->toBeNull()
        ->and(Gravacao::withTrashed()->find($mini->gravacao_id)->status)->toBe(Gravacao::RECUSADA)
        ->and(MiniAulaEntrega::count())->toBe(0)
        ->and(CriancaEstatistica::where('crianca_id', $this->ana->id)->value('xp_total'))->toBeNull();

    $this->comoAdulto($this->paiA)->get("/api/painel/mini-aulas/{$mini->id}/audio")->assertNotFound();
    $this->comoAdulto($this->paiA)->getJson('/api/painel/mini-aulas?status=recusada')->assertJsonCount(1);
    $this->comoCrianca($this->beto)->getJson('/api/crianca/mini-aulas/recebidas')->assertJsonPath('novas', 0);
    $this->comoCrianca($this->ana)->getJson('/api/crianca/mini-aulas/minhas')->assertJsonPath('mini_aulas.0.status', 'recusada');
});

it('a autora ganha XP por amigo que acerta, com teto por mini-aula (contra farming)', function () {
    config()->set('teia.mini_aulas.teto_xp_autora', 2);
    $amigos = Crianca::factory()->for($this->turmaB)->count(3)->create();
    $mini = MiniAula::findOrFail(gravarMiniAula($this->ana, $this->teia)['id']);
    $this->comoAdulto($this->paiA)->postJson("/api/painel/mini-aulas/{$mini->id}/aprovar")->assertOk()->assertJsonPath('entregas', 5);

    foreach ($amigos as $amigo) {
        $entrega = MiniAulaEntrega::where('crianca_id', $amigo->id)->firstOrFail();
        $this->comoCrianca($amigo)->postJson("/api/crianca/mini-aulas/entregas/{$entrega->id}/responder", respostaCerta($mini))->assertJsonPath('correta', true);
    }

    expect($mini->fresh()->xp_autora)->toBe(2)
        ->and(CriancaEstatistica::where('crianca_id', $this->ana->id)->value('xp_total'))->toBe(3 + 2);
});

it('encerrar a amizade apaga as entregas entre as duas turmas e o áudio deixa de ser servido', function () {
    $mini = MiniAula::findOrFail(gravarMiniAula($this->ana, $this->teia)['id']);
    $this->comoAdulto($this->paiA)->postJson("/api/painel/mini-aulas/{$mini->id}/aprovar")->assertOk()->assertJsonPath('entregas', 2);

    $this->comoAdulto($this->paiB)->deleteJson("/api/painel/amizades/{$this->amizade->id}")->assertOk();

    expect(MiniAulaEntrega::pluck('crianca_id')->all())->toBe([$this->duda->id]);
    $this->comoCrianca($this->beto)->getJson('/api/crianca/mini-aulas/recebidas')->assertJsonPath('novas', 0);
    $this->comoCrianca($this->beto)->get("/api/crianca/audios/{$mini->gravacao_id}")->assertNotFound();
    $this->comoCrianca($this->duda)->get("/api/crianca/audios/{$mini->gravacao_id}")->assertOk();
});

it('limita o número de mini-aulas por dia, a duração e o tipo do arquivo', function () {
    $modelo = $this->comoCrianca($this->ana)->getJson("/api/crianca/mini-aulas/modelos?aula_id={$this->teia->id}")->json('modelos.0.chave');
    $enviar = fn (array $extra = []) => $this->comoCrianca($this->ana)->post('/api/crianca/mini-aulas', [
        'aula_id' => $this->teia->id, 'modelo' => $modelo, 'semente' => 0, 'audio' => audioFalso(), ...$extra,
    ], ['Accept' => 'application/json']);

    $enviar(['duracao_ms' => 61000])->assertUnprocessable()->assertJsonValidationErrors('duracao_ms');
    $enviar(['audio' => UploadedFile::fake()->create('nota.txt', 4, 'text/plain')])->assertUnprocessable()->assertJsonValidationErrors('audio');
    $enviar(['audio' => audioFalso('aula.webm', 3000)])->assertUnprocessable()->assertJsonValidationErrors('audio');
    $enviar(['modelo' => 'silaba:INEXISTENTE'])->assertUnprocessable()->assertJsonValidationErrors('modelo');

    config()->set('teia.mini_aulas.por_dia', 2);
    $enviar()->assertCreated();
    $enviar()->assertCreated();
    $terceira = $enviar()->assertUnprocessable()->assertJsonValidationErrors('audio');

    expect(MiniAula::count())->toBe(2)
        ->and(mb_strtolower($terceira->json('message')))->toContain('amanhã');
});

it('excluir a criança autora leva as mini-aulas e entregas junto; a entrega de quem foi excluído some', function () {
    $mini = MiniAula::findOrFail(gravarMiniAula($this->ana, $this->teia)['id']);
    $this->comoAdulto($this->paiA)->postJson("/api/painel/mini-aulas/{$mini->id}/aprovar")->assertOk();

    // Soft delete da autora: a mini-aula some das recebidas (whereHas autor).
    $this->ana->delete();
    $this->comoCrianca($this->beto)->getJson('/api/crianca/mini-aulas/recebidas')->assertJsonPath('novas', 0)->assertJsonPath('entregas', []);
    $this->comoCrianca($this->beto)->get("/api/crianca/audios/{$mini->gravacao_id}")->assertNotFound();

    // Exclusão definitiva: cascata no banco.
    $this->ana->forceDelete();
    expect(MiniAula::count())->toBe(0)->and(MiniAulaEntrega::count())->toBe(0);
});

it('a amizade pendente ou encerrada não alcança ninguém', function () {
    $this->amizade->update(['status' => TurmaAmizade::ENCERRADA]);
    $mini = MiniAula::findOrFail(gravarMiniAula($this->ana, $this->teia)['id']);
    $this->comoAdulto($this->paiA)->postJson("/api/painel/mini-aulas/{$mini->id}/aprovar")->assertOk()->assertJsonPath('entregas', 1);

    expect(MiniAulaEntrega::pluck('crianca_id')->all())->toBe([$this->duda->id]);
});
