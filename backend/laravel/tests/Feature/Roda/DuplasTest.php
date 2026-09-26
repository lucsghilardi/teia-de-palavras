<?php

use App\Events\DuplaAtualizada;
use App\Events\RodaAtualizada;
use App\Models\Crianca;
use App\Models\CriancaConquista;
use App\Models\CriancaEstatistica;
use App\Models\CriancaResposta;
use App\Models\Dupla;
use App\Models\TeiaPalavra;
use App\Models\Turma;
use App\Models\User;
use App\Services\Roda\RodaService;
use Illuminate\Support\Facades\Event;

/*
| Duplas na Roda: uma criança propõe, a outra confirma ("concordo") ou pede
| para mudar; confirmar avalia a proposta para as duas. A vez alterna.
*/

beforeEach(function () {
    semearConteudo();
    Event::fake([RodaAtualizada::class, DuplaAtualizada::class]);

    $this->educador = User::factory()->create();
    $this->turma = Turma::factory()->for($this->educador, 'educador')->create();
    $this->ana = Crianca::factory()->for($this->turma)->create(['apelido' => 'Ana']);
    $this->beto = Crianca::factory()->for($this->turma)->create(['apelido' => 'Beto']);
    $this->caio = Crianca::factory()->for($this->turma)->create(['apelido' => 'Caio']);
    $this->teia = aulaDaPalavra('TEIA');
    $this->roda = app(RodaService::class)->abrir($this->turma, $this->teia, $this->educador);

    foreach ([$this->ana, $this->beto, $this->caio] as $crianca) {
        $this->comoCrianca($crianca)->postJson('/api/crianca/rodas/entrar', [])->assertOk();
    }

    $this->comandar = fn (string $acao, ?int $valor = null) => $this->comoAdulto($this->educador)
        ->postJson("/api/painel/rodas/{$this->roda->id}/comandos", array_filter(['acao' => $acao, 'valor' => $valor], fn ($v) => $v !== null))->assertOk();
    $this->propor = fn (Crianca $c, array $resposta) => $this->comoCrianca($c)->postJson("/api/crianca/rodas/{$this->roda->id}/dupla/propor", $resposta);
    $this->responder = fn (Crianca $c, bool $aceitar) => $this->comoCrianca($c)->postJson("/api/crianca/rodas/{$this->roda->id}/dupla/responder", ['aceitar' => $aceitar]);
});

it('duplas automáticas só com quem está na roda (quem sobra fica sem dupla); pares manuais são validados', function () {
    $json = $this->comoAdulto($this->educador)->postJson("/api/painel/rodas/{$this->roda->id}/duplas", ['automatico' => true])->assertOk()->json();

    expect($json['duplas'])->toHaveCount(1)->and($json['roda']['duplas'])->toHaveCount(1)
        ->and($json['duplas'][0]['criancas'])->toHaveCount(2)
        ->and($json['duplas'][0]['vez_de'])->toBe($json['duplas'][0]['criancas'][0]['id'])
        ->and($json['duplas'][0]['tentativa'])->toBeNull();

    $ids = [$json['duplas'][0]['criancas'][0]['id'], $json['duplas'][0]['criancas'][1]['id']];
    $sozinha = collect([$this->ana, $this->beto, $this->caio])->first(fn ($c) => ! in_array($c->id, $ids, true));
    $this->comoCrianca($sozinha)->getJson("/api/crianca/rodas/{$this->roda->id}")->assertOk()->assertJsonPath('dupla', null);

    // Quem saiu não entra nas duplas.
    $this->comoCrianca($this->caio)->postJson("/api/crianca/rodas/{$this->roda->id}/sair")->assertOk();
    $json = $this->comoAdulto($this->educador)->postJson("/api/painel/rodas/{$this->roda->id}/duplas", ['automatico' => true])->assertOk()->json();
    expect(collect($json['duplas'][0]['criancas'])->pluck('id')->sort()->values()->all())->toBe([$this->ana->id, $this->beto->id]);

    $this->comoAdulto($this->educador)->postJson("/api/painel/rodas/{$this->roda->id}/duplas", ['pares' => [[$this->ana->id, $this->ana->id]]])->assertUnprocessable();
    $this->comoAdulto($this->educador)->postJson("/api/painel/rodas/{$this->roda->id}/duplas", ['pares' => [[$this->ana->id, $this->caio->id]]])->assertUnprocessable();
    $this->comoAdulto($this->educador)->postJson("/api/painel/rodas/{$this->roda->id}/duplas", ['pares' => [[$this->beto->id, $this->ana->id]]])
        ->assertOk()->assertJsonPath('duplas.0.criancas.0.apelido', 'Beto')->assertJsonPath('duplas.0.vez_de', $this->beto->id);

    expect(Dupla::where('turma_sessao_id', $this->roda->id)->count())->toBe(1);
    Event::assertDispatched(DuplaAtualizada::class);
});

it('a vez alterna: A propõe, B concorda e a palavra entra na Teia das duas (origem dupla, medalha); pendente dá 409; fora da vez 403', function () {
    $this->comoAdulto($this->educador)->postJson("/api/painel/rodas/{$this->roda->id}/duplas", ['pares' => [[$this->ana->id, $this->beto->id]]])->assertOk();
    ($this->comandar)('ir_etapa', 5);

    ($this->propor)($this->beto, ['silabas' => ['TA', 'TU']])->assertForbidden();
    ($this->responder)($this->beto, true)->assertConflict();

    $dupla = ($this->propor)($this->ana, ['silabas' => ['TA', 'TU']])->assertOk()->json();
    expect($dupla['vez_de'])->toBe($this->ana->id)
        ->and($dupla['tentativa'])->toMatchArray(['status' => 'proposta', 'atividade_ordem' => 5, 'proposta_por' => $this->ana->id, 'valida' => null, 'resultado' => null])
        ->and($dupla['tentativa']['resposta'])->toBe(['silabas' => ['TA', 'TU']]);

    ($this->propor)($this->ana, ['silabas' => ['TE', 'TO']])->assertConflict();
    ($this->responder)($this->ana, true)->assertForbidden();

    $dupla = ($this->responder)($this->beto, true)->assertOk()->json();
    expect($dupla['tentativa'])->toMatchArray(['status' => 'confirmada', 'valida' => true, 'palavra' => 'TATU'])
        ->and($dupla['tentativa']['resultado']['valida'])->toBeTrue()
        ->and($dupla['tentativa']['resultado']['nova_na_teia'])->toBeTrue()
        ->and($dupla['vez_de'])->toBe($this->beto->id)
        ->and(collect($dupla['palavras'])->pluck('palavra')->all())->toBe(['TATU']);

    foreach ([$this->ana, $this->beto] as $c) {
        expect(TeiaPalavra::where('crianca_id', $c->id)->where('origem', 'dupla')->pluck('palavra_exibida')->all())->toBe(['TATU'])
            ->and(CriancaConquista::where('crianca_id', $c->id)->pluck('chave')->all())->toContain('ajudou_amigo')
            ->and((int) CriancaEstatistica::where('crianca_id', $c->id)->value('xp_total'))->toBe(1);
    }

    // B propõe; A pede para mudar: nada é avaliado e a vez volta para A.
    ($this->propor)($this->beto, ['silabas' => ['TU', 'TA']])->assertOk();
    $dupla = ($this->responder)($this->ana, false)->assertOk()->json();
    expect($dupla['tentativa'])->toMatchArray(['status' => 'recusada', 'valida' => null, 'resultado' => null])
        ->and($dupla['vez_de'])->toBe($this->ana->id)
        ->and(TeiaPalavra::where('crianca_id', $this->beto->id)->count())->toBe(1);

    // Palavra inválida confirmada: dica gentil, nada entra na Teia.
    ($this->propor)($this->ana, ['silabas' => ['TU', 'TA']])->assertOk();
    $dupla = ($this->responder)($this->beto, true)->assertOk()->json();
    expect($dupla['tentativa']['valida'])->toBeFalse()
        ->and($dupla['tentativa']['dica'])->toBeString()
        ->and(mb_strtolower($dupla['tentativa']['dica']))->not->toContain('errad')
        ->and(TeiaPalavra::where('crianca_id', $this->ana->id)->count())->toBe(1);

    Event::assertDispatched(DuplaAtualizada::class, fn (DuplaAtualizada $e) => ($e->estado['tentativa']['palavra'] ?? null) === 'TATU');
});

it('numa atividade avaliada a dupla responde junto, com a mesma política de feedback para as duas', function () {
    $this->comoAdulto($this->educador)->postJson("/api/painel/rodas/{$this->roda->id}/duplas", ['pares' => [[$this->ana->id, $this->beto->id]]])->assertOk();
    ($this->comandar)('ir_etapa', 6); // escolher_silaba: TA_TU

    ($this->propor)($this->ana, ['item' => 'e1', 'silaba' => 'TO'])->assertOk();
    $dupla = ($this->responder)($this->beto, true)->assertOk()->json();
    expect($dupla['tentativa'])->toMatchArray(['status' => 'confirmada', 'valida' => false, 'atividade_ordem' => 6])
        ->and($dupla['tentativa']['resultado'])->toMatchArray(['correta' => false, 'resolvido' => false, 'tentativas' => 1])
        ->and($dupla['tentativa']['resultado']['dica'])->toBeString()
        ->and(CriancaResposta::whereIn('crianca_id', [$this->ana->id, $this->beto->id])->count())->toBe(2);

    ($this->propor)($this->beto, ['item' => 'e1', 'silaba' => 'TU'])->assertOk();
    $dupla = ($this->responder)($this->ana, true)->assertOk()->json();
    expect($dupla['tentativa']['valida'])->toBeTrue()
        ->and($dupla['tentativa']['resultado'])->toMatchArray(['correta' => true, 'resolvido' => true, 'xp_ganho' => 1])
        ->and((int) CriancaEstatistica::where('crianca_id', $this->ana->id)->value('xp_total'))->toBe(1)
        ->and((int) CriancaEstatistica::where('crianca_id', $this->beto->id)->value('xp_total'))->toBe(1);

    // A história não é etapa de dupla.
    ($this->comandar)('ir_etapa', 1);
    ($this->propor)($this->ana, ['item' => 'x'])->assertUnprocessable();

    // Sem dupla, propor não faz sentido.
    $this->comoCrianca($this->caio)->postJson("/api/crianca/rodas/{$this->roda->id}/dupla/propor", ['item' => 'e1', 'silaba' => 'TU'])->assertUnprocessable();
});
