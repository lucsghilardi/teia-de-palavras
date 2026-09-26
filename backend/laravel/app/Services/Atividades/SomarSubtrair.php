<?php

namespace App\Services\Atividades;

use App\Models\AulaAtividade;
use App\Services\Atividades\Suporte\Embaralhador;
use App\Services\Atividades\Suporte\Mensagens;
use Illuminate\Validation\ValidationException;

/**
 * Fatos de adição e subtração (até 100), com apoio concreto (ícones), reta
 * numérica ou só símbolos (CPA). Os itens podem ser fixos ou gerados a partir
 * de `gerar`. O id do item carrega o fato ("7+5"), então a resposta
 * `{ item, valor }` é conferida sem depender do que foi sorteado.
 *
 * config: { itens?: [ { a, b, operacao: "+"|"-" } ], gerar?: { quantidade, maximo, operacoes: ["+","-"] },
 *           apoio?: icones|reta|nenhum, opcoes?: 2..5 }
 */
final class SomarSubtrair extends Generico
{
    public static function tipo(): string
    {
        return 'somar_subtrair';
    }

    protected function regras(): array
    {
        return [
            'itens' => ['nullable', 'array', 'max:12'],
            'itens.*.a' => ['required', 'integer', 'min:0', 'max:100'],
            'itens.*.b' => ['required', 'integer', 'min:0', 'max:100'],
            'itens.*.operacao' => ['required', 'string', 'in:+,-'],
            'gerar' => ['nullable', 'array'],
            'gerar.quantidade' => ['required_with:gerar', 'integer', 'min:1', 'max:12'],
            'gerar.maximo' => ['required_with:gerar', 'integer', 'min:2', 'max:100'],
            'gerar.operacoes' => ['required_with:gerar', 'array', 'min:1'],
            'gerar.operacoes.*' => ['string', 'in:+,-'],
            'apoio' => ['nullable', 'string', 'in:icones,reta,nenhum'],
            'opcoes' => ['nullable', 'integer', 'min:2', 'max:5'],
        ];
    }

    protected function normalizar(array $config): array
    {
        $itens = array_values(array_map(fn ($i) => ['a' => (int) $i['a'], 'b' => (int) $i['b'], 'operacao' => $i['operacao']], $config['itens'] ?? []));
        $gerar = $config['gerar'] ?? null;

        if ($itens === [] && $gerar === null) {
            throw ValidationException::withMessages(['itens' => 'Informe `itens` ou `gerar`.']);
        }

        foreach ($itens as $i => $item) {
            if ($item['operacao'] === '-' && $item['b'] > $item['a']) {
                throw ValidationException::withMessages(["itens.$i.b" => 'Na subtração, b não pode ser maior que a.']);
            }

            if ($item['operacao'] === '+' && $item['a'] + $item['b'] > 100) {
                throw ValidationException::withMessages(["itens.$i.b" => 'A soma não pode passar de 100.']);
            }
        }

        return [
            'itens' => $itens,
            'gerar' => $gerar ? [
                'quantidade' => (int) $gerar['quantidade'],
                'maximo' => (int) $gerar['maximo'],
                'operacoes' => array_values(array_unique($gerar['operacoes'])),
            ] : null,
            'apoio' => $config['apoio'] ?? 'icones',
            'opcoes' => (int) ($config['opcoes'] ?? 3),
        ];
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        $config = $this->normalizar($atividade->configArray());
        // Itens gerados são estáveis por criança e atividade (não mudam de um dia para o outro).
        $sementeFatos = crc32(sprintf('%d|%d|%d', $contexto->crianca?->id ?? 0, $contexto->aula->id, $atividade->ordem));
        $itens = $config['itens'] !== [] ? $config['itens'] : self::gerar($config['gerar'], $sementeFatos);

        return [
            'apoio' => $config['apoio'],
            'itens' => array_map(fn ($item, $i) => [
                'id' => self::idDoFato($item),
                'a' => $item['a'],
                'b' => $item['b'],
                'operacao' => $item['operacao'],
                'opcoes' => Embaralhador::embaralhar(self::opcoesPara($item, $config['opcoes'], $sementeFatos + $i), $contexto->semente + $i),
            ], $itens, array_keys($itens)),
        ];
    }

    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade
    {
        $config = $this->normalizar($config);
        $fato = self::fatoDoId($this->texto($resposta, 'item'));

        if ($fato === null) {
            return ResultadoAtividade::erro(Mensagens::ERRO, 'toque numa das opções.', null, 'unico');
        }

        $certo = self::resultado($fato);
        $valor = (int) ($resposta['valor'] ?? PHP_INT_MIN);
        $id = self::idDoFato($fato);
        $revisao = [[
            'chave' => 'fato:'.$id,
            'disciplina' => (string) $contexto->aula->disciplina,
            'dados' => ['tipo' => self::tipo(), 'config' => ['itens' => [$fato], 'apoio' => $config['apoio'], 'opcoes' => $config['opcoes']]],
        ]];

        if ($valor === $certo) {
            return ResultadoAtividade::acerto(Mensagens::acerto($contexto->semente), (int) config('teia.xp.atividade_item', 1), $id, $revisao);
        }

        return ResultadoAtividade::erro(Mensagens::ERRO, self::dica($fato), ['valor' => $certo], $id, $revisao);
    }

    /** @param array{a: int, b: int, operacao: string} $fato */
    public static function resultado(array $fato): int
    {
        return $fato['operacao'] === '+' ? $fato['a'] + $fato['b'] : $fato['a'] - $fato['b'];
    }

    /** @param array{a: int, b: int, operacao: string} $fato */
    public static function idDoFato(array $fato): string
    {
        return sprintf('%d%s%d', $fato['a'], $fato['operacao'], $fato['b']);
    }

    /** @return array{a: int, b: int, operacao: string}|null */
    public static function fatoDoId(string $id): ?array
    {
        if (! preg_match('/^(\d{1,3})([+\-])(\d{1,3})$/', $id, $m)) {
            return null;
        }

        $fato = ['a' => (int) $m[1], 'b' => (int) $m[3], 'operacao' => $m[2]];

        return ($fato['operacao'] === '-' && $fato['b'] > $fato['a']) ? null : $fato;
    }

    /** @param array{a: int, b: int, operacao: string} $fato */
    public static function dica(array $fato): string
    {
        if ($fato['operacao'] === '+') {
            $de = max($fato['a'], $fato['b']);
            $passos = min($fato['a'], $fato['b']);
            $conta = implode(', ', range($de + 1, $de + min($passos, 3)));

            return $passos === 0 ? "somar zero não muda nada: fica {$de}." : "comece no {$de} e conte mais {$passos}: {$conta}…";
        }

        $conta = implode(', ', range($fato['a'] - 1, max(0, $fato['a'] - min($fato['b'], 3)), -1));

        return $fato['b'] === 0 ? "tirar zero não muda nada: fica {$fato['a']}." : "comece no {$fato['a']} e volte {$fato['b']}: {$conta}…";
    }

    /**
     * @param  array{quantidade: int, maximo: int, operacoes: list<string>}  $gerar
     * @return list<array{a: int, b: int, operacao: string}>
     */
    public static function gerar(array $gerar, int $semente): array
    {
        $itens = [];
        $vistos = [];
        $estado = ($semente & 0x7FFFFFFF) ?: 1;
        $proximo = function (int $limite) use (&$estado): int {
            $estado = (int) ((1103515245 * $estado + 12345) % 2147483648);

            return (int) (($estado >> 8) % max(1, $limite));
        };

        while (count($itens) < $gerar['quantidade'] && count($vistos) < 400) {
            $operacao = $gerar['operacoes'][$proximo(count($gerar['operacoes']))];
            $a = 1 + $proximo($gerar['maximo']);
            $b = $operacao === '+' ? $proximo(max(1, $gerar['maximo'] - $a + 1)) : $proximo($a + 1);

            if ($operacao === '+' && $a + $b > $gerar['maximo']) {
                $b = $gerar['maximo'] - $a;
            }

            $fato = ['a' => $a, 'b' => $b, 'operacao' => $operacao];
            $id = self::idDoFato($fato);

            if (isset($vistos[$id])) {
                $vistos[$id]++;

                continue;
            }

            $vistos[$id] = 1;
            $itens[] = $fato;
        }

        return $itens;
    }

    /**
     * @param  array{a: int, b: int, operacao: string}  $fato
     * @return list<int>
     */
    public static function opcoesPara(array $fato, int $total, int $semente): array
    {
        $certo = self::resultado($fato);
        $candidatas = [$certo];
        $deltas = [1, -1, 2, -2, 10, -10, 3, -3];
        $estado = ($semente & 0x7FFFFFFF) ?: 1;

        foreach ($deltas as $delta) {
            $valor = $certo + $delta;

            if ($valor >= 0 && $valor <= 100 && ! in_array($valor, $candidatas, true)) {
                $candidatas[] = $valor;
            }
        }

        // Escolhe distratores variados (determinístico).
        $distratores = array_slice($candidatas, 1);
        $escolhidos = [];

        while (count($escolhidos) < $total - 1 && $distratores !== []) {
            $estado = (int) ((1103515245 * $estado + 12345) % 2147483648);
            $i = (int) (($estado >> 8) % count($distratores));
            $escolhidos[] = $distratores[$i];
            array_splice($distratores, $i, 1);
        }

        return [$certo, ...$escolhidos];
    }
}
