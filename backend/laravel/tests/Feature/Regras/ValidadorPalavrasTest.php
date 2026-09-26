<?php

use App\Models\Crianca;
use App\Models\CriancaAula;
use App\Models\Palavra;
use App\Models\TeiaPalavra;
use App\Services\Palavras\ResultadoValidacao;
use App\Services\Palavras\ValidadorPalavras;

beforeEach(function () {
    semearConteudo();
    $this->crianca = Crianca::factory()->create();
    $this->validador = app(ValidadorPalavras::class);
    $this->teia = aulaDaPalavra('TEIA');
    $this->boneca = aulaDaPalavra('BONECA');
});

it('aceita palavra do dicionário da aula', function () {
    $r = $this->validador->validar($this->crianca, $this->teia, ['TA', 'TU']);

    expect($r->valida)->toBeTrue()
        ->and($r->tipo)->toBe(ResultadoValidacao::VALIDA)
        ->and($r->palavraExibida)->toBe('TATU')
        ->and($r->novaNaTeia)->toBeTrue()
        ->and($r->dica)->toBeNull();
});

it('aceita a própria palavra geradora montada com as palmas', function () {
    expect($this->validador->validar($this->crianca, $this->teia, ['TEI', 'A'])->valida)->toBeTrue();
});

it('aceita palavra do dicionário geral formada com as famílias disponíveis', function () {
    // TATU está nos dois; TETO só na aula. "TOTA" não existe. "TIA" está na aula;
    // usamos uma palavra só do dicionário geral: nenhuma cabe só com T + vogais,
    // então cadastramos uma para o teste.
    Palavra::create(['palavra' => 'TITIO', 'silabas' => ['TI', 'TI', 'O'], 'origem' => 'cms', 'aprovada' => true]);

    $r = $this->validador->validar($this->crianca, $this->teia, ['TI', 'TI', 'O']);

    expect($r->valida)->toBeTrue()->and($r->palavraExibida)->toBe('TITIO');
});

it('ignora acentos ao comparar e exibe a grafia do dicionário', function () {
    progresso($this->crianca, $this->teia, CriancaAula::CONCLUIDA);

    $r = $this->validador->validar($this->crianca, $this->boneca, ['BO', 'NE']);

    expect($r->valida)->toBeTrue()->and($r->palavraExibida)->toBe('BONÉ');
});

it('marca que a palavra já está na Teia da criança', function () {
    TeiaPalavra::create([
        'crianca_id' => $this->crianca->id,
        'palavra_normalizada' => 'TATU',
        'palavra_exibida' => 'TATU',
        'silabas' => ['TA', 'TU'],
        'aula_id' => $this->teia->id,
        'origem' => 'criacao',
        'descoberta_em' => now(),
    ]);

    $r = $this->validador->validar($this->crianca, $this->teia, ['TA', 'TU']);

    expect($r->valida)->toBeTrue()->and($r->novaNaTeia)->toBeFalse();
});

it('nunca diz "errado": palavra desconhecida recebe dica gentil', function () {
    $r = $this->validador->validar($this->crianca, $this->teia, ['TU', 'TO', 'TA']);

    expect($r->valida)->toBeFalse()
        ->and($r->tipo)->toBe(ResultadoValidacao::DESCONHECIDA)
        ->and($r->dica)->not->toBeEmpty()
        ->and(mb_strtolower($r->dica))->not->toContain('errad')
        ->and(mb_strtolower($r->dica))->not->toContain('incorret');
});

it('diz "quase lá" quando falta pecinha para uma palavra conhecida', function () {
    $r = $this->validador->validar($this->crianca, $this->teia, ['TA']);

    expect($r->valida)->toBeFalse()->and($r->tipo)->toBe(ResultadoValidacao::QUASE);
});

it('recusa sílaba de família que a criança ainda não liberou', function () {
    // PA vem da aula PULO, que a criança não começou.
    $r = $this->validador->validar($this->crianca, $this->teia, ['PA', 'TO']);

    expect($r->valida)->toBeFalse()->and($r->tipo)->toBe(ResultadoValidacao::SILABA_INDISPONIVEL);
});

it('avisa com carinho quando a palavra existe mas aguarda aprovação', function () {
    Palavra::create(['palavra' => 'TITA', 'silabas' => ['TI', 'TA'], 'origem' => 'sugestao', 'aprovada' => false]);

    $r = $this->validador->validar($this->crianca, $this->teia, ['TI', 'TA']);

    expect($r->valida)->toBeFalse()->and($r->tipo)->toBe(ResultadoValidacao::AGUARDANDO_APROVACAO);
});

it('toda dica existe e nenhuma usa palavras negativas', function () {
    foreach (ValidadorPalavras::DICAS as $dica) {
        expect(mb_strtolower($dica))->not->toContain('errad')
            ->and(mb_strtolower($dica))->not->toContain('incorret')
            ->and(mb_strtolower($dica))->not->toContain('não pode');
    }
});
