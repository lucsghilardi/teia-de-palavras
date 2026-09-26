<?php

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaConquista;
use App\Models\CriancaEstatistica;
use App\Models\CriancaItem;
use App\Services\Crianca\GamificacaoCrianca;

beforeEach(function () {
    semearConteudo();
    $this->crianca = Crianca::factory()->create();
});

it('lista todas as medalhas, ganhas e por ganhar, com ícone e sem comparar crianças', function () {
    $json = $this->comoCrianca($this->crianca)->getJson('/api/crianca/medalhas')->assertOk()->json();

    expect($json['total'])->toBe(count(config('conquistas')))
        ->and($json['desbloqueadas'])->toBe(0)
        ->and($json['medalhas'])->toHaveCount($json['total'])
        ->and(collect($json['medalhas'])->pluck('desbloqueada_em')->unique()->all())->toBe([null])
        ->and(collect($json['medalhas'])->every(fn ($m) => is_string($m['icone']) && $m['icone'] !== '' && is_string($m['titulo'])))->toBeTrue()
        ->and(json_encode($json))->not->toMatch('/ranking|posicao|colocad/i');

    CriancaConquista::create(['crianca_id' => $this->crianca->id, 'chave' => 'missao_1', 'desbloqueada_em' => now()]);

    $json = $this->comoCrianca($this->crianca)->getJson('/api/crianca/medalhas')->assertOk()->json();
    $medalha = collect($json['medalhas'])->firstWhere('chave', 'missao_1');

    expect($json['desbloqueadas'])->toBe(1)
        ->and($medalha['desbloqueada_em'])->not->toBeNull()
        ->and($medalha['icone'])->toBe('medal');
});

it('/eu expõe nível, XP até o próximo, sequências, medalhas e revisões devidas', function () {
    CriancaEstatistica::create(['crianca_id' => $this->crianca->id, 'xp_total' => 12, 'nivel' => 2, 'sequencia_atual' => 2, 'maior_sequencia' => 4]);
    CriancaConquista::create(['crianca_id' => $this->crianca->id, 'chave' => 'missao_1', 'desbloqueada_em' => now()]);
    CriancaItem::create(['crianca_id' => $this->crianca->id, 'disciplina' => 'matematica', 'chave' => 'fato:1+1', 'dados' => ['tipo' => 'somar_subtrair', 'config' => ['itens' => [['a' => 1, 'b' => 1, 'operacao' => '+']]]], 'proxima_revisao_em' => today()]);
    CriancaItem::create(['crianca_id' => $this->crianca->id, 'disciplina' => 'matematica', 'chave' => 'fato:2+2', 'dados' => ['tipo' => 'somar_subtrair', 'config' => ['itens' => [['a' => 2, 'b' => 2, 'operacao' => '+']]]], 'proxima_revisao_em' => today()->addDays(2)]);

    $this->comoCrianca($this->crianca)->getJson('/api/crianca/eu')
        ->assertOk()
        ->assertJsonPath('estrelas', 12)
        ->assertJsonPath('xp', 12)
        ->assertJsonPath('nivel', 2)
        ->assertJsonPath('xp_no_nivel', 2)
        ->assertJsonPath('xp_para_proximo', 15)
        ->assertJsonPath('sequencia_dias', 2)
        ->assertJsonPath('maior_sequencia', 4)
        ->assertJsonPath('medalhas_total', 1)
        ->assertJsonPath('revisao_devidos', 1);
});

it('o nível vem da tabela de XP e o último nível não tem próximo', function () {
    config(['teia.niveis' => [0, 10, 25]]);

    expect(GamificacaoCrianca::nivelPara(0))->toBe(1)
        ->and(GamificacaoCrianca::nivelPara(9))->toBe(1)
        ->and(GamificacaoCrianca::nivelPara(10))->toBe(2)
        ->and(GamificacaoCrianca::nivelPara(25))->toBe(3)
        ->and(GamificacaoCrianca::nivelPara(500))->toBe(3)
        ->and(GamificacaoCrianca::resumoNivel(30))->toBe(['xp' => 30, 'nivel' => 3, 'xp_no_nivel' => 5, 'xp_para_proximo' => null]);
});

it('ganhar XP atualiza o nível guardado nas estatísticas', function () {
    $gamificacao = app(GamificacaoCrianca::class);

    expect($gamificacao->darEstrelas($this->crianca, 9)->nivel)->toBe(1)
        ->and($gamificacao->darEstrelas($this->crianca, 1)->nivel)->toBe(2)
        ->and($gamificacao->darEstrelas($this->crianca, 15)->nivel)->toBe(3);
});

it('concluir a primeira missão de Matemática dá a medalha do planeta', function () {
    $aula = Aula::where('slug', 'matematica-1-somar-para-decolar')->firstOrFail();
    $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$aula->id}/iniciar")->assertOk();

    foreach (range(1, 5) as $n) {
        $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$aula->id}/etapas/{$n}/concluir")->assertOk();
    }

    $json = $this->comoCrianca($this->crianca)->postJson("/api/crianca/aulas/{$aula->id}/concluir")->assertOk()->json();

    expect(collect($json['conquistas'])->pluck('chave')->all())->toBe(['missao_1', 'planeta_matematica_1'])
        ->and(collect($json['conquistas'])->firstWhere('chave', 'planeta_matematica_1')['icone'])->toBe('calculator');

    $this->comoCrianca($this->crianca)->getJson('/api/crianca/medalhas')->assertOk()->assertJsonPath('desbloqueadas', 2);
});

it('sete dias seguidos desbloqueiam "Uma semana inteira"', function () {
    $gamificacao = app(GamificacaoCrianca::class);
    $inicio = today();

    foreach (range(0, 6) as $dia) {
        $this->travelTo($inicio->copy()->addDays($dia));
        $gamificacao->registrarDiaAtivo($this->crianca);
    }

    $chaves = collect($gamificacao->avaliarConquistas($this->crianca))->pluck('chave')->all();

    expect($chaves)->toBe(['tres_dias', 'sete_dias']);
});
