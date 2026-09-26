<?php

use App\Models\Crianca;
use App\Models\Gravacao;
use App\Models\Turma;
use App\Models\User;
use App\Services\Amizades\AmizadeService;
use Illuminate\Support\Facades\Storage;

/*
| LGPD do áudio: uma gravação aprovada só é servida a crianças da mesma turma
| de quem gravou ou de uma turma amiga (amizade aceita). Nunca fora disso.
*/

beforeEach(function () {
    Storage::fake('local');
    $this->turmaA = Turma::factory()->create();
    $this->turmaB = Turma::factory()->create();
    $this->turmaC = Turma::factory()->create();
    $this->autora = Crianca::factory()->for($this->turmaA)->create();
    $this->colega = Crianca::factory()->for($this->turmaA)->create();
    $this->amiga = Crianca::factory()->for($this->turmaB)->create();
    $this->estranha = Crianca::factory()->for($this->turmaC)->create();

    Storage::disk('local')->put('gravacoes/1/voz.webm', 'audio');
    $this->gravacao = Gravacao::create([
        'crianca_id' => $this->autora->id, 'alvo_tipo' => 'palavra', 'alvo_id' => 1,
        'arquivo_path' => 'gravacoes/1/voz.webm', 'status' => Gravacao::APROVADA,
    ]);
});

it('serve a gravação aprovada para a mesma turma e para a turma amiga; 404 para as outras', function () {
    $this->comoCrianca($this->autora)->get("/api/crianca/audios/{$this->gravacao->id}")->assertOk()->assertHeader('Content-Type', 'audio/webm');
    $this->comoCrianca($this->colega)->get("/api/crianca/audios/{$this->gravacao->id}")->assertOk();
    $this->comoCrianca($this->amiga)->get("/api/crianca/audios/{$this->gravacao->id}")->assertNotFound();
    $this->comoCrianca($this->estranha)->get("/api/crianca/audios/{$this->gravacao->id}")->assertNotFound();

    $amizades = app(AmizadeService::class);
    $convite = $amizades->gerar($this->turmaA, User::factory()->create());
    $amizade = $amizades->aceitar($this->turmaB, $convite->codigo, User::factory()->create(), true);

    $this->comoCrianca($this->amiga)->get("/api/crianca/audios/{$this->gravacao->id}")->assertOk();
    $this->comoCrianca($this->estranha)->get("/api/crianca/audios/{$this->gravacao->id}")->assertNotFound();

    $amizades->encerrar($amizade);
    $this->comoCrianca($this->amiga)->get("/api/crianca/audios/{$this->gravacao->id}")->assertNotFound();
});

it('nunca serve gravação pendente, recusada ou removida, nem sem token', function () {
    $this->get("/api/crianca/audios/{$this->gravacao->id}")->assertUnauthorized();

    $this->gravacao->update(['status' => Gravacao::PENDENTE]);
    $this->comoCrianca($this->colega)->get("/api/crianca/audios/{$this->gravacao->id}")->assertNotFound();

    $this->gravacao->update(['status' => Gravacao::RECUSADA]);
    $this->comoCrianca($this->colega)->get("/api/crianca/audios/{$this->gravacao->id}")->assertNotFound();

    $this->gravacao->update(['status' => Gravacao::APROVADA]);
    $this->gravacao->delete();
    $this->comoCrianca($this->colega)->get("/api/crianca/audios/{$this->gravacao->id}")->assertNotFound();
});
