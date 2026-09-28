<?php

use App\Models\Aula;
use App\Models\AulaAtividade;
use App\Services\Atividades\Contar;
use App\Services\Atividades\ContextoAtividade;
use App\Services\Atividades\Escolha;
use App\Services\Atividades\EscolherSilaba;
use App\Services\Atividades\Ordenar;
use App\Services\Atividades\Parear;
use App\Services\Atividades\RegistroAtividades;
use App\Services\Atividades\SomarSubtrair;
use App\Services\Atividades\Suporte\Embaralhador;
use App\Services\Atividades\VerdadeiroFalso;
use App\Services\Audio\ResolverAudio;
use Illuminate\Validation\ValidationException;

/** Contexto sem criança (como no painel), com semente fixa. */
function contextoDeTeste(int $semente = 7): ContextoAtividade
{
    $aula = new Aula(['id' => 42, 'disciplina' => 'matematica', 'titulo' => 'T']);
    $aula->id = 42;

    return new ContextoAtividade(null, $aula, ResolverAudio::paraTurma(0), [], $semente);
}

function atividadeDeTeste(string $tipo, array $config): AulaAtividade
{
    return new AulaAtividade(['aula_id' => 42, 'ordem' => 1, 'tipo' => $tipo, 'config' => $config]);
}

/** Nenhum feedback pode soar como "errado". */
function semPalavrasNegativas(?string ...$textos): void
{
    foreach ($textos as $texto) {
        expect(mb_strtolower((string) $texto))->not->toMatch('/errad|incorret|burr|fracass/');
    }
}

it('registra os tipos genéricos como avaliados', function () {
    expect(RegistroAtividades::avaliados())->toContain('escolha', 'verdadeiro_falso', 'ordenar', 'linha_do_tempo', 'parear', 'contar', 'somar_subtrair', 'escolher_silaba')
        ->and(RegistroAtividades::ehAvaliada('historia'))->toBeFalse()
        ->and(RegistroAtividades::para('linha_do_tempo'))->toBeInstanceOf(Ordenar::class);
});

it('embaralha de forma determinística e sem repetir a ordem original', function () {
    $itens = ['a', 'b', 'c', 'd'];

    expect(Embaralhador::embaralhar($itens, 5))->toBe(Embaralhador::embaralhar($itens, 5))
        ->and(Embaralhador::embaralhar($itens, 5))->not->toBe(Embaralhador::embaralhar($itens, 6))
        ->and(sort_copia(Embaralhador::embaralhar($itens, 5)))->toBe($itens)
        ->and(Embaralhador::embaralharDiferente($itens, 1))->not->toBe($itens)
        ->and(Embaralhador::embaralharDiferente(['x'], 1))->toBe(['x']);
});

function sort_copia(array $a): array
{
    sort($a);

    return $a;
}

describe('escolha', function () {
    $config = ['itens' => [
        ['pergunta' => 'quem subiu no teto?', 'opcoes' => ['o tatu', 'a boneca', 'o robô'], 'correta' => 0, 'dica' => 'ouça de novo a história.', 'explicacao' => 'foi o tatu.'],
    ]];

    it('valida, normaliza ids e recusa índice fora das opções', function () use ($config) {
        $normalizado = app(Escolha::class)->validarConfig($config);

        expect($normalizado['itens'][0]['id'])->toBe('q1')->and($normalizado['embaralhar'])->toBeTrue();

        expect(fn () => app(Escolha::class)->validarConfig(['itens' => [['pergunta' => 'x', 'opcoes' => ['a', 'b'], 'correta' => 5]]]))
            ->toThrow(ValidationException::class);
        expect(fn () => app(Escolha::class)->validarConfig(['itens' => []]))->toThrow(ValidationException::class);
    });

    it('monta sem vazar a resposta e avalia pelo id da opção', function () use ($config) {
        $montado = app(Escolha::class)->montar(atividadeDeTeste('escolha', $config), contextoDeTeste());

        expect($montado['itens'][0])->not->toHaveKey('correta')
            ->and(collect($montado['itens'][0]['opcoes'])->pluck('texto')->sort()->values()->all())->toBe(['a boneca', 'o robô', 'o tatu']);

        $idCerta = collect($montado['itens'][0]['opcoes'])->firstWhere('texto', 'o tatu')['id'];
        $idErrada = collect($montado['itens'][0]['opcoes'])->firstWhere('texto', 'o robô')['id'];

        $acerto = app(Escolha::class)->avaliar($config, ['item' => 'q1', 'opcao' => $idCerta], contextoDeTeste());
        $erro = app(Escolha::class)->avaliar($config, ['item' => 'q1', 'opcao' => $idErrada], contextoDeTeste());

        expect($acerto->correta)->toBeTrue()->and($acerto->xp)->toBe(1)->and($acerto->item)->toBe('q1')
            ->and($acerto->itensRevisao[0]['chave'])->toBe('escolha:42:q1')
            ->and($erro->correta)->toBeFalse()->and($erro->dica)->toBe('ouça de novo a história.')
            ->and($erro->respostaCorreta['texto'])->toBe('o tatu')
            ->and($erro->semRespostaCorreta()->respostaCorreta)->toBeNull();

        semPalavrasNegativas($acerto->mensagem, $erro->mensagem, $erro->dica);
    });

    it('verdadeiro ou falso vira escolha de duas opções fixas', function () {
        $config = ['itens' => [['frase' => 'o sol nasce no leste', 'correta' => true]]];
        $montado = app(VerdadeiroFalso::class)->montar(atividadeDeTeste('verdadeiro_falso', $config), contextoDeTeste());

        expect(array_column($montado['itens'][0]['opcoes'], 'texto'))->toBe(['verdadeiro', 'falso']);

        $resultado = app(VerdadeiroFalso::class)->avaliar($config, ['item' => 'v1', 'opcao' => $montado['itens'][0]['opcoes'][0]['id']], contextoDeTeste());

        expect($resultado->correta)->toBeTrue();
    });
});

describe('ordenar', function () {
    $config = ['modo' => 'tempo', 'itens' => [['texto' => 'acordar'], ['texto' => 'escovar os dentes'], ['texto' => 'ir para a escola']]];

    it('embaralha e aceita só a ordem do config', function () use ($config) {
        $montado = app(Ordenar::class)->montar(atividadeDeTeste('ordenar', $config), contextoDeTeste());
        $textos = array_column($montado['itens'], 'texto');

        expect($textos)->not->toBe(['acordar', 'escovar os dentes', 'ir para a escola'])
            ->and(sort_copia($textos))->toBe(['acordar', 'escovar os dentes', 'ir para a escola']);

        $porTexto = collect($montado['itens'])->keyBy('texto');
        $certa = [$porTexto['acordar']['id'], $porTexto['escovar os dentes']['id'], $porTexto['ir para a escola']['id']];

        expect(app(Ordenar::class)->avaliar($config, ['ordem' => $certa], contextoDeTeste())->correta)->toBeTrue();

        $erro = app(Ordenar::class)->avaliar($config, ['ordem' => array_reverse($certa)], contextoDeTeste());

        expect($erro->correta)->toBeFalse()->and($erro->respostaCorreta['ordem'])->toBe($certa);
        semPalavrasNegativas($erro->mensagem, $erro->dica);
    });
});

describe('parear', function () {
    $config = ['pares' => [['a' => 'escola', 'b' => 'estudar'], ['a' => 'padaria', 'b' => 'fazer pão'], ['a' => 'hospital', 'b' => 'cuidar']]];

    it('confere um par por vez', function () use ($config) {
        $montado = app(Parear::class)->montar(atividadeDeTeste('parear', $config), contextoDeTeste());
        $escola = collect($montado['esquerda'])->firstWhere('texto', 'escola')['id'];
        $estudar = collect($montado['direita'])->firstWhere('texto', 'estudar')['id'];
        $cuidar = collect($montado['direita'])->firstWhere('texto', 'cuidar')['id'];

        expect(app(Parear::class)->avaliar($config, ['item' => $escola, 'b' => $estudar], contextoDeTeste())->correta)->toBeTrue();

        $erro = app(Parear::class)->avaliar($config, ['item' => $escola, 'b' => $cuidar], contextoDeTeste());

        expect($erro->correta)->toBeFalse()->and($erro->respostaCorreta['texto'])->toBe('estudar')->and($erro->item)->toBe($escola);
        semPalavrasNegativas($erro->mensagem, $erro->dica);
    });
});

describe('contar', function () {
    it('gera opções ao redor da quantidade e avalia o valor', function () {
        $config = ['itens' => [['icone' => 'star', 'quantidade' => 12]]];
        $normalizado = app(Contar::class)->validarConfig($config);

        expect($normalizado['itens'][0]['opcoes'])->toContain(12)->and(count($normalizado['itens'][0]['opcoes']))->toBe(3);

        $montado = app(Contar::class)->montar(atividadeDeTeste('contar', $config), contextoDeTeste());

        expect($montado['itens'][0]['quantidade'])->toBe(12);

        expect(app(Contar::class)->avaliar($config, ['item' => 'c1', 'valor' => 12], contextoDeTeste())->correta)->toBeTrue();

        $erro = app(Contar::class)->avaliar($config, ['item' => 'c1', 'valor' => 14], contextoDeTeste());

        expect($erro->correta)->toBeFalse()->and($erro->respostaCorreta)->toBe(['valor' => 12])->and($erro->itensRevisao[0]['chave'])->toBe('contar:12');
    });
});

describe('somar e subtrair', function () {
    it('gera fatos determinísticos dentro do máximo, sem negativos', function () {
        $fatos = SomarSubtrair::gerar(['quantidade' => 6, 'maximo' => 20, 'operacoes' => ['+', '-']], 99);

        expect($fatos)->toHaveCount(6)->and($fatos)->toBe(SomarSubtrair::gerar(['quantidade' => 6, 'maximo' => 20, 'operacoes' => ['+', '-']], 99));

        foreach ($fatos as $fato) {
            $resultado = SomarSubtrair::resultado($fato);
            expect($resultado)->toBeGreaterThanOrEqual(0)->and($resultado)->toBeLessThanOrEqual(20);
        }
    });

    it('avalia pelo fato no id e dá dica de contagem', function () {
        $config = ['itens' => [['a' => 7, 'b' => 5, 'operacao' => '+']], 'apoio' => 'icones'];
        $montado = app(SomarSubtrair::class)->montar(atividadeDeTeste('somar_subtrair', $config), contextoDeTeste());

        expect($montado['itens'][0]['id'])->toBe('7+5')->and($montado['itens'][0]['opcoes'])->toContain(12)->and($montado['apoio'])->toBe('icones');

        expect(app(SomarSubtrair::class)->avaliar($config, ['item' => '7+5', 'valor' => 12], contextoDeTeste())->correta)->toBeTrue();

        $erro = app(SomarSubtrair::class)->avaliar($config, ['item' => '7+5', 'valor' => 11], contextoDeTeste());

        expect($erro->correta)->toBeFalse()->and($erro->dica)->toContain('comece no 7')->and($erro->respostaCorreta)->toBe(['valor' => 12])
            ->and($erro->itensRevisao[0]['chave'])->toBe('fato:7+5');

        expect(app(SomarSubtrair::class)->avaliar($config, ['item' => '12-5', 'valor' => 7], contextoDeTeste())->correta)->toBeTrue();
        expect(app(SomarSubtrair::class)->avaliar($config, ['item' => '5-12', 'valor' => 7], contextoDeTeste())->correta)->toBeFalse();
        semPalavrasNegativas($erro->mensagem, $erro->dica);
    });

    it('recusa config sem itens e sem gerar, e subtração negativa', function () {
        expect(fn () => app(SomarSubtrair::class)->validarConfig(['apoio' => 'reta']))->toThrow(ValidationException::class);
        expect(fn () => app(SomarSubtrair::class)->validarConfig(['itens' => [['a' => 3, 'b' => 5, 'operacao' => '-']]]))->toThrow(ValidationException::class);
    });
});

describe('escolher sílaba', function () {
    it('completa a sílaba que falta', function () {
        $config = ['itens' => [['modo' => 'completar', 'palavra' => 'TATU', 'silabas' => ['TA', 'TU'], 'oculta' => 1, 'opcoes' => ['TO', 'TE']]]];
        $normalizado = app(EscolherSilaba::class)->validarConfig($config);

        expect($normalizado['itens'][0]['opcoes'])->toContain('TU'); // a certa entra sozinha

        $montado = app(EscolherSilaba::class)->montar(atividadeDeTeste('escolher_silaba', $config), contextoDeTeste());

        expect($montado['itens'][0]['pecas'])->toBe(['TA', null])->and($montado['itens'][0])->not->toHaveKey('correta');

        expect(app(EscolherSilaba::class)->avaliar($config, ['item' => 'e1', 'silaba' => 'tu'], contextoDeTeste())->correta)->toBeTrue();

        $erro = app(EscolherSilaba::class)->avaliar($config, ['item' => 'e1', 'silaba' => 'TO'], contextoDeTeste());

        expect($erro->correta)->toBeFalse()->and($erro->respostaCorreta['silaba'])->toBe('TU');
        semPalavrasNegativas($erro->mensagem, $erro->dica);
    });

    it('troca uma sílaba para formar outra palavra (consciência silábica)', function () {
        $config = ['itens' => [['modo' => 'trocar', 'de' => 'MOLA', 'silabas' => ['MO', 'LA'], 'para' => 'MALA', 'posicao' => 0, 'opcoes' => ['MA', 'MO', 'LA']]]];

        $acerto = app(EscolherSilaba::class)->avaliar($config, ['item' => 'e1', 'silaba' => 'MA'], contextoDeTeste());

        expect($acerto->correta)->toBeTrue()->and($acerto->mensagem)->toContain('MALA')->and($acerto->itensRevisao[0]['chave'])->toBe('silaba:MOLA>MALA');

        expect(fn () => app(EscolherSilaba::class)->validarConfig(['itens' => [['modo' => 'trocar', 'de' => 'MOLA', 'silabas' => ['MO', 'LA'], 'para' => 'BOLO', 'posicao' => 0, 'opcoes' => ['MA']]]]))
            ->toThrow(ValidationException::class);
        expect(fn () => app(EscolherSilaba::class)->validarConfig(['itens' => [['modo' => 'completar', 'palavra' => 'TATU', 'silabas' => ['TA', 'TO'], 'oculta' => 0, 'opcoes' => ['TA']]]]))
            ->toThrow(ValidationException::class);
    });
});
