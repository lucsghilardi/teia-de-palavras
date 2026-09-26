<?php

namespace App\Services\Atividades;

use App\Models\AulaAtividade;
use App\Services\Atividades\Suporte\Embaralhador;
use App\Services\Palavras\Silabador;
use App\Support\Texto;
use Illuminate\Validation\ValidationException;

/**
 * Ditado (ouvir → montar): a criança ouve a palavra e monta com peças de
 * sílaba. Resposta `{ item, silabas: ["TE","TO"] }`. O payload traz `fala`
 * (a palavra em minúsculas, para a voz do navegador quando não há gravação);
 * a tela nunca mostra esse texto.
 *
 * config: { itens: [ { id?, palavra: "TETO", silabas?: ["TE","TO"], opcoes?: ["TE","TO","TA","TU"], dica? } ] }
 */
final class Ditado extends Generico
{
    public static function tipo(): string
    {
        return 'ditado';
    }

    protected function regras(): array
    {
        return [
            'itens' => ['required', 'array', 'min:1', 'max:12'],
            'itens.*.id' => ['nullable', 'string', 'max:40'],
            'itens.*.palavra' => ['required', 'string', 'max:40'],
            'itens.*.silabas' => ['nullable', 'array', 'max:8'],
            'itens.*.silabas.*' => ['string', 'max:8'],
            'itens.*.opcoes' => ['nullable', 'array', 'max:10'],
            'itens.*.opcoes.*' => ['string', 'max:8'],
            'itens.*.dica' => ['nullable', 'string', 'max:200'],
        ];
    }

    protected function normalizar(array $config): array
    {
        $itens = [];

        foreach (array_values($config['itens']) as $i => $item) {
            $palavra = mb_strtoupper(trim($item['palavra']), 'UTF-8');
            $silabas = array_values(array_filter(array_map(fn ($s) => mb_strtoupper(trim((string) $s), 'UTF-8'), $item['silabas'] ?? [])));

            if ($silabas === []) {
                $silabas = Silabador::separar($palavra);
            }

            if (Texto::juntarNormalizado($silabas) !== Texto::normalizar($palavra)) {
                throw ValidationException::withMessages(["itens.$i.silabas" => "As sílabas não formam {$palavra}."]);
            }

            $opcoes = array_map(fn ($s) => mb_strtoupper(trim((string) $s), 'UTF-8'), $item['opcoes'] ?? []);
            $opcoes = array_values(array_unique([...$silabas, ...$opcoes]));

            $itens[] = [
                'id' => ($item['id'] ?? null) ?: 'd'.($i + 1),
                'palavra' => $palavra,
                'silabas' => $silabas,
                'opcoes' => $opcoes,
                'dica' => $item['dica'] ?? null,
            ];
        }

        return ['itens' => $itens];
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        $config = $this->normalizar($atividade->configArray());

        return [
            'itens' => array_map(fn ($item, $i) => [
                'id' => $item['id'],
                'audio_url' => $contexto->audio->palavra($item['palavra']),
                'fala' => mb_strtolower($item['palavra'], 'UTF-8'),
                'tamanho' => count($item['silabas']),
                'opcoes' => Embaralhador::embaralhar($item['opcoes'], $contexto->semente + $i),
            ], $config['itens'], array_keys($config['itens'])),
        ];
    }

    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade
    {
        $config = $this->normalizar($config);
        $itemId = $this->texto($resposta, 'item');
        $item = collect($config['itens'])->firstWhere('id', $itemId) ?? $config['itens'][0];
        $dadas = array_values(array_map(fn ($s) => mb_strtoupper(trim((string) $s), 'UTF-8'), (array) ($resposta['silabas'] ?? [])));
        $revisao = [[
            'chave' => 'ditado:'.$item['palavra'],
            'disciplina' => (string) $contexto->aula->disciplina,
            'dados' => ['tipo' => self::tipo(), 'config' => ['itens' => [$item]]],
        ]];

        if ($dadas !== [] && Texto::juntarNormalizado($dadas) === Texto::normalizar($item['palavra'])) {
            return ResultadoAtividade::acerto('isso! '.mb_strtolower($item['palavra'], 'UTF-8').'.', (int) config('teia.xp.atividade_item', 1), $item['id'], $revisao);
        }

        return ResultadoAtividade::erro(
            'não foi dessa vez.',
            $item['dica'] ?: self::dica($item['silabas'], $dadas),
            ['silabas' => $item['silabas'], 'palavra' => $item['palavra']],
            $item['id'],
            $revisao,
        );
    }

    /**
     * @param  list<string>  $silabas
     * @param  list<string>  $dadas
     */
    public static function dica(array $silabas, array $dadas): string
    {
        $n = count($silabas);

        if (count($dadas) !== $n) {
            return 'ouça de novo: a palavra tem '.($n === 1 ? '1 pedaço' : "{$n} pedaços").'.';
        }

        return 'ouça de novo e comece pelo primeiro pedaço: '.mb_strtolower($silabas[0], 'UTF-8').'.';
    }
}
