<?php

namespace App\Services\Atividades;

use App\Models\AulaAtividade;
use App\Services\Atividades\Suporte\Embaralhador;
use App\Services\Atividades\Suporte\Mensagens;
use Illuminate\Validation\ValidationException;

/**
 * Múltipla escolha: uma pergunta (ou várias), opções em texto, uma correta.
 * A criança recebe as opções embaralhadas com ids estáveis; a resposta é
 * `{ item, opcao }`.
 *
 * config: { itens: [ { id?, pergunta, opcoes: [texto…], correta: índice, dica?, explicacao?, icone? } ], embaralhar?: bool }
 */
class Escolha extends Generico
{
    public static function tipo(): string
    {
        return 'escolha';
    }

    protected function regras(): array
    {
        return [
            'itens' => ['required', 'array', 'min:1', 'max:12'],
            'itens.*.id' => ['nullable', 'string', 'max:40'],
            'itens.*.pergunta' => ['required', 'string', 'max:300'],
            'itens.*.opcoes' => ['required', 'array', 'min:2', 'max:6'],
            'itens.*.opcoes.*' => ['required', 'string', 'max:120'],
            'itens.*.correta' => ['required', 'integer', 'min:0'],
            'itens.*.dica' => ['nullable', 'string', 'max:200'],
            'itens.*.explicacao' => ['nullable', 'string', 'max:300'],
            'itens.*.icone' => ['nullable', 'string', 'max:40'],
            'embaralhar' => ['nullable', 'boolean'],
        ];
    }

    protected function normalizar(array $config): array
    {
        $itens = [];

        foreach (array_values($config['itens']) as $i => $item) {
            $opcoes = array_values(array_map('strval', $item['opcoes']));

            if ((int) $item['correta'] >= count($opcoes)) {
                throw ValidationException::withMessages([
                    "itens.$i.correta" => 'A opção correta precisa apontar para uma das opções.',
                ]);
            }

            $itens[] = [
                'id' => ($item['id'] ?? null) ?: 'q'.($i + 1),
                'pergunta' => trim($item['pergunta']),
                'opcoes' => $opcoes,
                'correta' => (int) $item['correta'],
                'dica' => $item['dica'] ?? null,
                'explicacao' => $item['explicacao'] ?? null,
                'icone' => $item['icone'] ?? null,
            ];
        }

        return ['itens' => $itens, 'embaralhar' => (bool) ($config['embaralhar'] ?? true)];
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        $config = $this->configDe($atividade);
        $itens = [];

        foreach ($config['itens'] as $indice => $item) {
            $opcoes = [];

            foreach ($item['opcoes'] as $posicao => $texto) {
                $opcoes[] = ['id' => $this->idOpcao($item['id'], $posicao, $texto), 'texto' => $texto];
            }

            if ($config['embaralhar']) {
                $opcoes = Embaralhador::embaralhar($opcoes, $contexto->semente + $indice);
            }

            $itens[] = [
                'id' => $item['id'],
                'pergunta' => $item['pergunta'],
                'icone' => $item['icone'],
                'opcoes' => $opcoes,
            ];
        }

        return ['itens' => $itens];
    }

    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade
    {
        $config = $this->normalizar($config);
        $itemId = $this->texto($resposta, 'item');
        $item = collect($config['itens'])->firstWhere('id', $itemId) ?? $config['itens'][0];
        $escolhida = $this->texto($resposta, 'opcao');
        $correta = $item['correta'];
        $idCorreta = $this->idOpcao($item['id'], $correta, $item['opcoes'][$correta]);
        $revisao = [$this->itemRevisao($item, $config['embaralhar'], $contexto)];

        if ($escolhida !== '' && $escolhida === $idCorreta) {
            return ResultadoAtividade::acerto(Mensagens::acerto($contexto->semente), (int) config('teia.xp.atividade_item', 1), $item['id'], $revisao);
        }

        return ResultadoAtividade::erro(
            Mensagens::ERRO,
            $item['dica'] ?: Mensagens::DICA_PADRAO,
            ['opcao' => $idCorreta, 'texto' => $item['opcoes'][$correta], 'explicacao' => $item['explicacao']],
            $item['id'],
            $revisao,
        );
    }

    /** @return array<string, mixed> */
    protected function configDe(AulaAtividade $atividade): array
    {
        return $this->normalizar($atividade->configArray());
    }

    protected function idOpcao(string $itemId, int $posicao, string $texto): string
    {
        return Embaralhador::id(static::tipo(), $itemId, (string) $posicao, $texto);
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array{chave: string, disciplina: string, dados: array<string, mixed>}
     */
    protected function itemRevisao(array $item, bool $embaralhar, ContextoAtividade $contexto): array
    {
        return [
            'chave' => sprintf('%s:%d:%s', static::tipo(), $contexto->aula->id, $item['id']),
            'disciplina' => (string) $contexto->aula->disciplina,
            'dados' => ['tipo' => static::tipo(), 'config' => ['itens' => [$item], 'embaralhar' => $embaralhar]],
        ];
    }
}
