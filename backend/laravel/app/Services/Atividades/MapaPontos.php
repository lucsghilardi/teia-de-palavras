<?php

namespace App\Services\Atividades;

use App\Models\AulaAtividade;
use App\Services\Atividades\Suporte\Mensagens;
use Illuminate\Validation\ValidationException;

/**
 * Mapa com pontos (Geografia): um cenário desenhado pelo app (`bairro`,
 * `escola`) com lugares marcados; a criança toca no lugar que a pergunta
 * pede. Resposta `{ item, ponto }`.
 *
 * config: { cenario: "bairro", pontos: [ { chave, rotulo, icone?, x: 0..1, y: 0..1 } ],
 *           perguntas: [ { id?, alvo: chave, texto, dica? } ] }
 */
final class MapaPontos extends Generico
{
    public const CENARIOS = ['bairro', 'escola'];

    public static function tipo(): string
    {
        return 'mapa_pontos';
    }

    protected function regras(): array
    {
        return [
            'cenario' => ['required', 'string', 'in:'.implode(',', self::CENARIOS)],
            'pontos' => ['required', 'array', 'min:2', 'max:12'],
            'pontos.*.chave' => ['required', 'string', 'max:40'],
            'pontos.*.rotulo' => ['required', 'string', 'max:60'],
            'pontos.*.icone' => ['nullable', 'string', 'max:40'],
            'pontos.*.x' => ['required', 'numeric', 'min:0', 'max:1'],
            'pontos.*.y' => ['required', 'numeric', 'min:0', 'max:1'],
            'perguntas' => ['required', 'array', 'min:1', 'max:12'],
            'perguntas.*.id' => ['nullable', 'string', 'max:40'],
            'perguntas.*.alvo' => ['required', 'string', 'max:40'],
            'perguntas.*.texto' => ['required', 'string', 'max:200'],
            'perguntas.*.dica' => ['nullable', 'string', 'max:200'],
        ];
    }

    protected function normalizar(array $config): array
    {
        $pontos = array_values(array_map(fn ($p) => [
            'chave' => trim($p['chave']),
            'rotulo' => trim($p['rotulo']),
            'icone' => $p['icone'] ?? null,
            'x' => round((float) $p['x'], 3),
            'y' => round((float) $p['y'], 3),
        ], $config['pontos']));
        $chaves = array_column($pontos, 'chave');

        if (count($chaves) !== count(array_unique($chaves))) {
            throw ValidationException::withMessages(['pontos' => 'Cada ponto precisa de uma chave diferente.']);
        }

        $perguntas = [];

        foreach (array_values($config['perguntas']) as $i => $pergunta) {
            if (! in_array($pergunta['alvo'], $chaves, true)) {
                throw ValidationException::withMessages(["perguntas.$i.alvo" => 'O alvo precisa ser a chave de um dos pontos.']);
            }

            $perguntas[] = [
                'id' => ($pergunta['id'] ?? null) ?: 'p'.($i + 1),
                'alvo' => $pergunta['alvo'],
                'texto' => trim($pergunta['texto']),
                'dica' => $pergunta['dica'] ?? null,
            ];
        }

        return ['cenario' => $config['cenario'], 'pontos' => $pontos, 'perguntas' => $perguntas];
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        $config = $this->normalizar($atividade->configArray());

        return [
            'cenario' => $config['cenario'],
            'pontos' => $config['pontos'],
            // As perguntas sem o alvo: a resposta nunca vai para a tela.
            'itens' => array_map(fn ($p) => ['id' => $p['id'], 'texto' => $p['texto']], $config['perguntas']),
        ];
    }

    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade
    {
        $config = $this->normalizar($config);
        $itemId = $this->texto($resposta, 'item');
        $pergunta = collect($config['perguntas'])->firstWhere('id', $itemId) ?? $config['perguntas'][0];
        $ponto = $this->texto($resposta, 'ponto');
        $alvo = collect($config['pontos'])->firstWhere('chave', $pergunta['alvo']);
        $revisao = [[
            'chave' => sprintf('mapa:%d:%s', $contexto->aula->id, $pergunta['id']),
            'disciplina' => (string) $contexto->aula->disciplina,
            'dados' => ['tipo' => self::tipo(), 'config' => ['cenario' => $config['cenario'], 'pontos' => $config['pontos'], 'perguntas' => [$pergunta]]],
        ]];

        if ($ponto !== '' && $ponto === $pergunta['alvo']) {
            return ResultadoAtividade::acerto(Mensagens::acerto($contexto->semente), (int) config('teia.xp.atividade_item', 1), $pergunta['id'], $revisao);
        }

        return ResultadoAtividade::erro(
            Mensagens::ERRO,
            $pergunta['dica'] ?: 'olhe o mapa inteiro antes de tocar. toque nos lugares para ouvir o nome de cada um.',
            ['ponto' => $pergunta['alvo'], 'rotulo' => $alvo['rotulo'] ?? $pergunta['alvo']],
            $pergunta['id'],
            $revisao,
        );
    }
}
