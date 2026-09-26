<?php

namespace App\Services\Atividades;

use App\Models\AulaAtividade;
use App\Services\Atividades\Suporte\Embaralhador;
use App\Services\Atividades\Suporte\Mensagens;
use App\Support\Texto;
use Illuminate\Validation\ValidationException;

/**
 * Consciência silábica (EF02LP02): completar a sílaba que falta numa palavra
 * ou trocar uma sílaba para formar outra palavra. Resposta `{ item, silaba }`.
 *
 * config: { itens: [
 *   { id?, modo: "completar", palavra: "TATU", silabas: ["TA","TU"], oculta: 1, opcoes: ["TU","TO","TE"], dica? },
 *   { id?, modo: "trocar", de: "MOLA", silabas: ["MO","LA"], para: "MALA", posicao: 0, opcoes: ["MA","MO","LA"], dica? }
 * ] }
 */
final class EscolherSilaba extends Generico
{
    public static function tipo(): string
    {
        return 'escolher_silaba';
    }

    protected function regras(): array
    {
        return [
            'itens' => ['required', 'array', 'min:1', 'max:12'],
            'itens.*.id' => ['nullable', 'string', 'max:40'],
            'itens.*.modo' => ['required', 'string', 'in:completar,trocar'],
            // `palavra` (ou `de`, no modo trocar): o config normalizado guarda sempre em `palavra`.
            'itens.*.palavra' => ['nullable', 'string', 'max:40'],
            'itens.*.de' => ['nullable', 'string', 'max:40'],
            'itens.*.para' => ['required_if:itens.*.modo,trocar', 'nullable', 'string', 'max:40'],
            'itens.*.silabas' => ['required', 'array', 'min:1', 'max:8'],
            'itens.*.silabas.*' => ['required', 'string', 'max:8'],
            'itens.*.oculta' => ['nullable', 'integer', 'min:0'],
            'itens.*.posicao' => ['nullable', 'integer', 'min:0'],
            'itens.*.opcoes' => ['required', 'array', 'min:2', 'max:6'],
            'itens.*.opcoes.*' => ['required', 'string', 'max:8'],
            'itens.*.dica' => ['nullable', 'string', 'max:200'],
        ];
    }

    protected function normalizar(array $config): array
    {
        $itens = [];

        foreach (array_values($config['itens']) as $i => $item) {
            $silabas = array_values(array_map(fn ($s) => mb_strtoupper(trim($s), 'UTF-8'), $item['silabas']));
            $opcoes = array_values(array_unique(array_map(fn ($s) => mb_strtoupper(trim($s), 'UTF-8'), $item['opcoes'])));
            $modo = $item['modo'];
            // No config de entrada, completar usa `oculta`; o normalizado guarda `posicao` nos dois modos.
            $posicao = (int) ($item['posicao'] ?? ($modo === 'completar' ? ($item['oculta'] ?? 0) : 0));

            if ($posicao >= count($silabas)) {
                throw ValidationException::withMessages(["itens.$i.".($modo === 'completar' ? 'oculta' : 'posicao') => 'A posição precisa apontar para uma das sílabas.']);
            }

            $palavra = mb_strtoupper(trim((string) ($item['palavra'] ?? $item['de'] ?? '')), 'UTF-8');

            if ($palavra === '') {
                throw ValidationException::withMessages(["itens.$i.".($modo === 'completar' ? 'palavra' : 'de') => 'Informe a palavra.']);
            }

            if (Texto::juntarNormalizado($silabas) !== Texto::normalizar($palavra)) {
                throw ValidationException::withMessages(["itens.$i.silabas" => "As sílabas não formam {$palavra}."]);
            }

            if ($modo === 'completar') {
                $correta = $silabas[$posicao];
                $para = null;
            } else {
                $para = mb_strtoupper(trim((string) $item['para']), 'UTF-8');
                $novas = $silabas;
                $correta = $this->silabaQueForma($novas, $posicao, $para, $opcoes);

                if ($correta === null) {
                    throw ValidationException::withMessages(["itens.$i.para" => "Nenhuma opção transforma {$palavra} em {$para}."]);
                }
            }

            if (! in_array($correta, $opcoes, true)) {
                $opcoes[] = $correta;
            }

            $itens[] = [
                'id' => ($item['id'] ?? null) ?: 'e'.($i + 1),
                'modo' => $modo,
                'palavra' => $palavra,
                'silabas' => $silabas,
                'posicao' => $posicao,
                'para' => $para,
                'correta' => $correta,
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
            'itens' => array_map(function ($item, $i) use ($contexto) {
                $pecas = $item['silabas'];
                $pecas[$item['posicao']] = null; // a sílaba que a criança escolhe

                return [
                    'id' => $item['id'],
                    'modo' => $item['modo'],
                    // Em "trocar" a criança vê a palavra de partida e a de chegada; o desafio é achar a sílaba.
                    'palavra' => $item['modo'] === 'trocar' ? $item['palavra'] : null,
                    'alvo' => $item['modo'] === 'trocar' ? $item['para'] : null,
                    'pecas' => array_values($pecas),
                    'posicao' => $item['posicao'],
                    'opcoes' => Embaralhador::embaralhar($item['opcoes'], $contexto->semente + $i),
                ];
            }, $config['itens'], array_keys($config['itens'])),
        ];
    }

    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade
    {
        $config = $this->normalizar($config);
        $itemId = $this->texto($resposta, 'item');
        $item = collect($config['itens'])->firstWhere('id', $itemId) ?? $config['itens'][0];
        $silaba = mb_strtoupper($this->texto($resposta, 'silaba'), 'UTF-8');
        $alvo = $item['modo'] === 'completar' ? $item['palavra'] : $item['para'];
        $revisao = [[
            'chave' => sprintf('silaba:%s>%s', $item['palavra'], $alvo),
            'disciplina' => (string) $contexto->aula->disciplina,
            'dados' => ['tipo' => self::tipo(), 'config' => ['itens' => [$this->itemDeRevisao($item)]]],
        ]];

        if ($silaba !== '' && Texto::normalizar($silaba) === Texto::normalizar($item['correta'])) {
            $mensagem = $item['modo'] === 'trocar' ? "isso! {$item['palavra']} virou {$alvo}." : Mensagens::acerto($contexto->semente);

            return ResultadoAtividade::acerto($mensagem, (int) config('teia.xp.atividade_item', 1), $item['id'], $revisao);
        }

        $dica = $item['dica'] ?: ($item['modo'] === 'completar'
            ? 'fale a palavra devagar e escute o pedaço que falta.'
            : "qual pedaço muda {$item['palavra']} para formar {$alvo}?");

        return ResultadoAtividade::erro(Mensagens::ERRO, $dica, ['silaba' => $item['correta'], 'palavra' => $alvo], $item['id'], $revisao);
    }

    /** @param list<string> $silabas */
    private function silabaQueForma(array $silabas, int $posicao, string $para, array $opcoes): ?string
    {
        foreach ($opcoes as $opcao) {
            $teste = $silabas;
            $teste[$posicao] = $opcao;

            if (Texto::juntarNormalizado($teste) === Texto::normalizar($para)) {
                return $opcao;
            }
        }

        // A opção correta pode não ter sido listada: deduz pela palavra alvo.
        $prefixo = implode('', array_slice($silabas, 0, $posicao));
        $sufixo = implode('', array_slice($silabas, $posicao + 1));
        $miolo = mb_substr($para, mb_strlen($prefixo), mb_strlen($para) - mb_strlen($prefixo) - mb_strlen($sufixo));

        return $miolo !== '' && Texto::normalizar($prefixo.$miolo.$sufixo) === Texto::normalizar($para) ? $miolo : null;
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function itemDeRevisao(array $item): array
    {
        return $item['modo'] === 'completar'
            ? ['id' => $item['id'], 'modo' => 'completar', 'palavra' => $item['palavra'], 'silabas' => $item['silabas'], 'oculta' => $item['posicao'], 'opcoes' => $item['opcoes'], 'dica' => $item['dica']]
            : ['id' => $item['id'], 'modo' => 'trocar', 'de' => $item['palavra'], 'silabas' => $item['silabas'], 'para' => $item['para'], 'posicao' => $item['posicao'], 'opcoes' => $item['opcoes'], 'dica' => $item['dica']];
    }
}
