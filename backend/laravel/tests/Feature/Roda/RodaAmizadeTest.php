<?php

use App\Broadcasting\RodaChannel;
use App\Events\DuplaAtualizada;
use App\Events\RodaAtualizada;
use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\Turma;
use App\Models\User;
use App\Services\Amizades\AmizadeService;
use App\Services\Roda\RodaService;
use Illuminate\Support\Facades\Event;

/*
| Crianças de turmas amigas entram na Roda pelo código (ou veem a roda aberta
| da turma amiga); sem amizade, nada. O canal de presença segue a mesma regra.
*/

beforeEach(function () {
    semearConteudo();
    Event::fake([RodaAtualizada::class, DuplaAtualizada::class]);

    $this->educadorA = User::factory()->create();
    $this->turmaA = Turma::factory()->for($this->educadorA, 'educador')->create(['nome' => 'Casa A']);
    $this->turmaB = Turma::factory()->create(['nome' => 'Casa B']);
    $this->turmaC = Turma::factory()->create(['nome' => 'Casa C']);
    $this->ana = Crianca::factory()->for($this->turmaA)->create(['apelido' => 'Ana']);
    $this->beto = Crianca::factory()->for($this->turmaB)->create(['apelido' => 'Beto']);
    $this->caio = Crianca::factory()->for($this->turmaC)->create(['apelido' => 'Caio']);

    $amizades = app(AmizadeService::class);
    $amizades->aceitar($this->turmaB, $amizades->gerar($this->turmaA, $this->educadorA)->codigo, $this->turmaB->educador, true);

    $this->roda = app(RodaService::class)->abrir($this->turmaA, aulaDaPalavra('TEIA'), $this->educadorA);
});

it('a criança da turma amiga vê e entra na roda; a de turma sem amizade não', function () {
    $this->comoCrianca($this->beto)->getJson('/api/crianca/roda')->assertOk()->assertJsonPath('roda.id', $this->roda->id)->assertJsonPath('roda.turma.nome', 'Casa A');
    $this->comoCrianca($this->caio)->getJson('/api/crianca/roda')->assertOk()->assertJsonPath('roda', null);

    $this->comoCrianca($this->caio)->postJson('/api/crianca/rodas/entrar', ['codigo' => $this->roda->codigo])->assertNotFound();
    $this->comoCrianca($this->caio)->postJson('/api/crianca/rodas/entrar', [])->assertNotFound();
    $this->comoCrianca($this->caio)->getJson("/api/crianca/rodas/{$this->roda->id}")->assertNotFound();

    $this->comoCrianca($this->beto)->postJson('/api/crianca/rodas/entrar', ['codigo' => $this->roda->codigo])->assertOk()->assertJsonPath('roda.participantes.0.apelido', 'Beto');
    $this->comoCrianca($this->ana)->postJson('/api/crianca/rodas/entrar', [])->assertOk()->assertJsonCount(2, 'roda.participantes');

    // Encerrar conclui a missão para a amiga também.
    $this->comoAdulto($this->educadorA)->postJson("/api/painel/rodas/{$this->roda->id}/comandos", ['acao' => 'encerrar'])->assertOk();
    expect(CriancaAula::where('crianca_id', $this->beto->id)->value('status'))->toBe(CriancaAula::CONCLUIDA);
});

it('o canal de presença aceita o educador da turma, as crianças da turma e das amigas, e mais ninguém', function () {
    $canal = app(RodaChannel::class);

    expect($canal->join($this->educadorA, $this->roda->id))->toMatchArray(['tipo' => 'educador'])
        ->and($canal->join(User::factory()->create(), $this->roda->id))->toBeFalse()
        ->and($canal->join(User::factory()->admin()->create(), $this->roda->id))->toMatchArray(['tipo' => 'educador'])
        ->and($canal->join($this->ana, $this->roda->id))->toMatchArray(['tipo' => 'crianca', 'crianca_id' => $this->ana->id, 'apelido' => 'Ana'])
        ->and($canal->join($this->beto, $this->roda->id)['avatar']['chave'])->toBe('nave')
        ->and($canal->join($this->caio, $this->roda->id))->toBeFalse()
        ->and($canal->join($this->ana, 999999))->toBeFalse();

    $this->roda->update(['status' => 'encerrada']);
    expect($canal->join($this->ana, $this->roda->id))->toBeFalse();
});

it('a rota de autorização da criança assina o canal de presença (ou nega)', function () {
    config()->set('broadcasting.default', 'reverb');
    config()->set('broadcasting.connections.reverb', [
        'driver' => 'reverb', 'key' => 'chave-teste', 'secret' => 'segredo-teste', 'app_id' => '1',
        'options' => ['host' => 'localhost', 'port' => 8080, 'scheme' => 'http', 'useTLS' => false],
        'client_options' => [],
    ]);

    $corpo = ['socket_id' => '1234.5678', 'channel_name' => "presence-roda.{$this->roda->id}"];

    // Os canais foram registrados no driver `null` do phpunit.xml; o driver reverb precisa deles também.
    require base_path('routes/channels.php');

    $resposta = $this->comoCrianca($this->beto)->postJson('/api/crianca/broadcasting/auth', $corpo)->assertOk();
    $dados = json_decode($resposta->getContent(), true);

    expect($dados['auth'])->toStartWith('chave-teste:')
        ->and(json_decode($dados['channel_data'], true)['user_info']['apelido'])->toBe('Beto');

    $this->comoCrianca($this->caio)->postJson('/api/crianca/broadcasting/auth', $corpo)->assertForbidden();
    // Sem token (os headers do último comoCrianca são descartados): 401.
    $this->flushHeaders()->postJson('/api/crianca/broadcasting/auth', $corpo)->assertUnauthorized();
});
