<?php

use App\Services\Atividades\Dinheiro;
use App\Services\Atividades\Ditado;
use App\Services\Atividades\MapaPontos;
use App\Services\Atividades\RegistroAtividades;
use Illuminate\Validation\ValidationException;

it('registra dinheiro, mapa_pontos e ditado como avaliados', function () {
    expect(RegistroAtividades::avaliados())->toContain('dinheiro', 'mapa_pontos', 'ditado');
});

describe('dinheiro', function () {
    $config = ['itens' => [['preco' => 7, 'moedas' => [10, 1, 5, 2, 1], 'dica' => null]]];

    it('valida, ordena as moedas e recusa preço impossível', function () use ($config) {
        $normalizado = app(Dinheiro::class)->validarConfig($config);

        expect($normalizado['itens'][0]['moedas'])->toBe([1, 1, 2, 5, 10])
            ->and($normalizado['itens'][0]['id'])->toBe('d1')
            ->and(app(Dinheiro::class)->validarConfig($normalizado))->toEqual($normalizado);

        expect(fn () => app(Dinheiro::class)->validarConfig(['itens' => [['preco' => 4, 'moedas' => [5, 10]]]]))->toThrow(ValidationException::class);
        expect(fn () => app(Dinheiro::class)->validarConfig(['itens' => [['preco' => 4, 'moedas' => [3, 1]]]]))->toThrow(ValidationException::class);
    });

    it('acha uma combinação que soma o preço', function () {
        expect(Dinheiro::combinacao([1, 1, 2, 5, 10], 7))->toBe([2, 5])
            ->and(Dinheiro::combinacao([1, 1, 2, 5, 10], 12))->toBe([2, 10])
            ->and(Dinheiro::combinacao([5, 10], 4))->toBeNull()
            ->and(Dinheiro::combinacao([2, 5, 5, 10, 20], 12))->toBe([2, 10]);
    });

    it('monta com ids por moeda e aceita qualquer combinação certa; erro explica o que falta', function () use ($config) {
        $montado = app(Dinheiro::class)->montar(atividadeDeTeste('dinheiro', $config), contextoDeTeste());
        $moedas = collect($montado['itens'][0]['moedas']);

        expect($montado['itens'][0]['preco'])->toBe(7)
            ->and($moedas->pluck('valor')->all())->toBe([1, 1, 2, 5, 10])
            ->and($moedas->pluck('id')->unique())->toHaveCount(5);

        $ids = fn (array $valores) => collect($valores)->map(function ($v) use ($moedas, &$usadas) {
            $m = $moedas->first(fn ($m) => $m['valor'] === $v && ! in_array($m['id'], $usadas ?? [], true));
            $usadas[] = $m['id'];

            return $m['id'];
        })->all();

        $usadas = [];
        $acerto = app(Dinheiro::class)->avaliar($config, ['item' => 'd1', 'escolhidas' => $ids([5, 2])], contextoDeTeste());
        $usadas = [];
        $outro = app(Dinheiro::class)->avaliar($config, ['item' => 'd1', 'escolhidas' => $ids([5, 1, 1])], contextoDeTeste());
        $usadas = [];
        $falta = app(Dinheiro::class)->avaliar($config, ['item' => 'd1', 'escolhidas' => $ids([5])], contextoDeTeste());
        $usadas = [];
        $sobra = app(Dinheiro::class)->avaliar($config, ['item' => 'd1', 'escolhidas' => $ids([10])], contextoDeTeste());

        expect($acerto->correta)->toBeTrue()
            ->and($outro->correta)->toBeTrue()
            ->and($falta->correta)->toBeFalse()
            ->and($falta->dica)->toBe('você juntou 5; faltam 2 reais.')
            ->and($sobra->dica)->toBe('passou 3 reais. tire uma moeda.')
            ->and($falta->respostaCorreta['valores'])->toBe([2, 5])
            ->and($falta->itensRevisao[0]['chave'])->toBe('dinheiro:7:1-1-2-5-10');

        semPalavrasNegativas($acerto->mensagem, $falta->mensagem, $falta->dica, $sobra->dica);
    });
});

describe('mapa_pontos', function () {
    $config = [
        'cenario' => 'bairro',
        'pontos' => [
            ['chave' => 'escola', 'rotulo' => 'escola', 'icone' => 'school', 'x' => 0.7, 'y' => 0.2],
            ['chave' => 'padaria', 'rotulo' => 'padaria', 'icone' => 'store', 'x' => 0.5, 'y' => 0.6],
        ],
        'perguntas' => [['alvo' => 'escola', 'texto' => 'onde fica a escola?']],
    ];

    it('valida alvos e chaves e monta sem o alvo', function () use ($config) {
        $normalizado = app(MapaPontos::class)->validarConfig($config);

        expect($normalizado['perguntas'][0]['id'])->toBe('p1')
            ->and(app(MapaPontos::class)->validarConfig($normalizado))->toEqual($normalizado);

        expect(fn () => app(MapaPontos::class)->validarConfig([...$config, 'perguntas' => [['alvo' => 'praca', 'texto' => 'x']]]))->toThrow(ValidationException::class);
        expect(fn () => app(MapaPontos::class)->validarConfig([...$config, 'cenario' => 'marte']))->toThrow(ValidationException::class);

        $montado = app(MapaPontos::class)->montar(atividadeDeTeste('mapa_pontos', $config), contextoDeTeste());

        expect($montado['cenario'])->toBe('bairro')
            ->and($montado['pontos'])->toHaveCount(2)
            ->and($montado['itens'])->toBe([['id' => 'p1', 'texto' => 'onde fica a escola?']])
            ->and(json_encode($montado))->not->toContain('alvo');
    });

    it('avalia pelo ponto tocado e mostra o certo no erro', function () use ($config) {
        $acerto = app(MapaPontos::class)->avaliar($config, ['item' => 'p1', 'ponto' => 'escola'], contextoDeTeste());
        $erro = app(MapaPontos::class)->avaliar($config, ['item' => 'p1', 'ponto' => 'padaria'], contextoDeTeste());

        expect($acerto->correta)->toBeTrue()
            ->and($erro->correta)->toBeFalse()
            ->and($erro->respostaCorreta)->toBe(['ponto' => 'escola', 'rotulo' => 'escola'])
            ->and($erro->itensRevisao[0]['chave'])->toBe('mapa:42:p1');

        semPalavrasNegativas($erro->mensagem, $erro->dica);
    });
});

describe('ditado', function () {
    $config = ['itens' => [['palavra' => 'teto', 'silabas' => ['TE', 'TO'], 'opcoes' => ['TA', 'TU']]]];

    it('valida, separa sílabas quando faltam e junta as opções', function () use ($config) {
        $normalizado = app(Ditado::class)->validarConfig($config);

        expect($normalizado['itens'][0])->toMatchArray(['id' => 'd1', 'palavra' => 'TETO', 'silabas' => ['TE', 'TO'], 'opcoes' => ['TE', 'TO', 'TA', 'TU']])
            ->and(app(Ditado::class)->validarConfig($normalizado))->toEqual($normalizado)
            ->and(app(Ditado::class)->validarConfig(['itens' => [['palavra' => 'TATU']]])['itens'][0]['silabas'])->toBe(['TA', 'TU']);

        expect(fn () => app(Ditado::class)->validarConfig(['itens' => [['palavra' => 'TETO', 'silabas' => ['TA', 'TU']]]]))->toThrow(ValidationException::class);
    });

    it('monta com a fala e o tamanho, sem a lista de sílabas, e avalia a montagem', function () use ($config) {
        $montado = app(Ditado::class)->montar(atividadeDeTeste('ditado', $config), contextoDeTeste());
        $item = $montado['itens'][0];

        expect($item['fala'])->toBe('teto')
            ->and($item['tamanho'])->toBe(2)
            ->and($item)->not->toHaveKey('silabas')
            ->and($item)->not->toHaveKey('palavra')
            ->and(collect($item['opcoes'])->sort()->values()->all())->toBe(['TA', 'TE', 'TO', 'TU']);

        $acerto = app(Ditado::class)->avaliar($config, ['item' => 'd1', 'silabas' => ['te', 'to']], contextoDeTeste());
        $curto = app(Ditado::class)->avaliar($config, ['item' => 'd1', 'silabas' => ['TE']], contextoDeTeste());
        $trocado = app(Ditado::class)->avaliar($config, ['item' => 'd1', 'silabas' => ['TA', 'TO']], contextoDeTeste());

        expect($acerto->correta)->toBeTrue()
            ->and($acerto->mensagem)->toBe('isso! teto.')
            ->and($curto->dica)->toBe('ouça de novo: a palavra tem 2 pedaços.')
            ->and($trocado->dica)->toBe('ouça de novo e comece pelo primeiro pedaço: te.')
            ->and($trocado->respostaCorreta)->toBe(['silabas' => ['TE', 'TO'], 'palavra' => 'TETO'])
            ->and($trocado->itensRevisao[0]['chave'])->toBe('ditado:TETO');

        semPalavrasNegativas($curto->mensagem, $curto->dica, $trocado->dica);
    });
});
