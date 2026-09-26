<?php

use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\CriancaConquista;
use App\Models\CriancaEstatistica;
use App\Models\CriancaItem;
use App\Models\CriancaResposta;
use App\Models\MiniAula;
use App\Models\MiniAulaEntrega;
use App\Models\Sessao;
use App\Models\TeiaPalavra;
use App\Models\Turma;
use App\Models\User;
use App\Services\Roda\RodaService;

beforeEach(function () {
    semearConteudo();
    $this->educador = User::factory()->create();
    $this->turma = Turma::factory()->for($this->educador, 'educador')->create(['nome' => 'Casa A']);
    $this->crianca = Crianca::factory()->for($this->turma)->create(['apelido' => 'Ana']);
});

it('resume o caminho da criança: XP, missões por planeta, revisão, respostas, mini-aulas, rodas, medalhas e uso', function () {
    $teia = aulaDaPalavra('TEIA');
    $boneca = aulaDaPalavra('BONECA');
    progresso($this->crianca, $teia, CriancaAula::CONCLUIDA);
    progresso($this->crianca, $boneca, CriancaAula::EM_ANDAMENTO);
    CriancaEstatistica::create(['crianca_id' => $this->crianca->id, 'xp_total' => 12, 'nivel' => 2, 'sequencia_atual' => 2, 'maior_sequencia' => 4, 'ultimo_dia_ativo' => today()]);
    CriancaConquista::create(['crianca_id' => $this->crianca->id, 'chave' => 'missao_1', 'desbloqueada_em' => now()]);
    TeiaPalavra::create(['crianca_id' => $this->crianca->id, 'aula_id' => $teia->id, 'palavra_normalizada' => 'TATU', 'palavra_exibida' => 'TATU', 'silabas' => ['TA', 'TU'], 'origem' => 'criacao', 'descoberta_em' => now()]);
    CriancaItem::create(['crianca_id' => $this->crianca->id, 'disciplina' => 'matematica', 'chave' => 'fato:7+5', 'dados' => ['tipo' => 'somar_subtrair', 'config' => []], 'caixa' => 0, 'acertos' => 1, 'erros' => 2, 'proxima_revisao_em' => today()]);
    CriancaItem::create(['crianca_id' => $this->crianca->id, 'disciplina' => 'matematica', 'chave' => 'fato:2+2', 'dados' => ['tipo' => 'somar_subtrair', 'config' => []], 'caixa' => 4, 'acertos' => 4, 'proxima_revisao_em' => today()->addDays(14)]);
    $atividade = $teia->atividades()->where('ordem', 6)->firstOrFail();
    CriancaResposta::create(['crianca_id' => $this->crianca->id, 'aula_atividade_id' => $atividade->id, 'item' => 'e1', 'tentativas' => 1, 'acertou' => true, 'acertou_na_primeira' => true]);
    CriancaResposta::create(['crianca_id' => $this->crianca->id, 'aula_atividade_id' => $atividade->id, 'item' => 'e2', 'tentativas' => 2, 'acertou' => true, 'acertou_na_primeira' => false]);
    $mini = MiniAula::create(['autor_crianca_id' => $this->crianca->id, 'disciplina' => 'portugues', 'modelo' => 'silaba:TATU', 'titulo' => 'Qual sílaba falta em tatu?', 'tipo' => 'escolher_silaba', 'config' => ['itens' => []], 'status' => MiniAula::APROVADA]);
    $colega = Crianca::factory()->for($this->turma)->create();
    MiniAulaEntrega::create(['mini_aula_id' => $mini->id, 'crianca_id' => $colega->id, 'status' => MiniAulaEntrega::RESPONDIDA, 'correta' => true]);
    $daColega = MiniAula::create(['autor_crianca_id' => $colega->id, 'disciplina' => 'portugues', 'modelo' => 'ditado:TETO', 'titulo' => 'Ditado: teto', 'tipo' => 'ditado', 'config' => ['itens' => []], 'status' => MiniAula::APROVADA]);
    MiniAulaEntrega::create(['mini_aula_id' => $daColega->id, 'crianca_id' => $this->crianca->id, 'status' => MiniAulaEntrega::RECEBIDA]);
    Sessao::create(['crianca_id' => $this->crianca->id, 'iniciada_em' => now()->subMinutes(20), 'ultima_atividade_em' => now()->subMinutes(5), 'origem' => 'individual']);
    $roda = app(RodaService::class)->abrir($this->turma, $teia, $this->educador);
    app(RodaService::class)->entrar($this->crianca, null);

    $json = $this->comoAdulto($this->educador)->getJson("/api/painel/progresso/{$this->crianca->id}")->assertOk()->json();

    expect($json['crianca'])->toMatchArray(['apelido' => 'Ana'])
        ->and($json['crianca']['turma']['nome'])->toBe('Casa A')
        ->and($json['xp'])->toMatchArray(['xp' => 12, 'nivel' => 2, 'xp_no_nivel' => 2, 'xp_para_proximo' => 15])
        ->and($json['sequencia'])->toMatchArray(['atual' => 2, 'maior' => 4])
        ->and(collect($json['missoes']['por_disciplina'])->pluck('chave')->all())->toBe(['portugues', 'matematica', 'geografia', 'historia'])
        ->and($json['missoes']['por_disciplina'][0])->toMatchArray(['nome' => 'Português', 'publicadas' => 5, 'concluidas' => 1, 'em_andamento' => 1])
        ->and($json['missoes']['por_disciplina'][1]['concluidas'])->toBe(0)
        ->and(collect($json['missoes']['ultimas'])->pluck('rotulo')->all())->toContain('TEIA', 'BONECA')
        ->and($json['teia'])->toMatchArray(['total' => 1])
        ->and($json['teia']['ultimas'][0]['palavra'])->toBe('TATU')
        ->and($json['revisao'])->toBe(['itens' => 2, 'dominados' => 1, 'devidos' => 1, 'acertos' => 5, 'erros' => 2])
        ->and($json['respostas'])->toBe(['itens' => 2, 'acertou' => 2, 'acertou_na_primeira' => 1])
        ->and($json['mini_aulas'])->toBe(['dadas' => 1, 'aprovadas' => 1, 'recebidas' => 1, 'respondidas' => 0])
        ->and($json['rodas'])->toBe(['participou' => 1])
        ->and($json['medalhas'])->toMatchArray(['desbloqueadas' => 1])
        ->and($json['medalhas']['ultimas'][0]['chave'])->toBe('missao_1')
        ->and($json['medalhas']['ultimas'][0]['icone'])->toBeString()
        ->and($json['uso']['dias_ativos_30d'])->toBe(1)
        // 20 min: a sessão aberta há 20 min foi "tocada" ao entrar na roda.
        ->and($json['uso']['minutos_30d'])->toBe(20)
        ->and(json_encode($json))->not->toMatch('/ranking|posicao|colocad/i');
});

it('só o educador da turma (ou admin) vê; a criança nova vem zerada', function () {
    $this->comoAdulto(User::factory()->create())->getJson("/api/painel/progresso/{$this->crianca->id}")->assertForbidden();
    $this->comoAdulto(User::factory()->admin()->create())->getJson("/api/painel/progresso/{$this->crianca->id}")->assertOk();

    $json = $this->comoAdulto($this->educador)->getJson("/api/painel/progresso/{$this->crianca->id}")->assertOk()->json();

    expect($json['xp'])->toMatchArray(['xp' => 0, 'nivel' => 1])
        ->and($json['missoes']['ultimas'])->toBe([])
        ->and($json['revisao']['itens'])->toBe(0)
        ->and($json['medalhas']['desbloqueadas'])->toBe(0)
        ->and($json['uso'])->toBe(['dias_ativos_30d' => 0, 'minutos_30d' => 0]);

    $this->comoAdulto($this->educador)->getJson('/api/painel/progresso/999999')->assertNotFound();
});
