<?php

namespace App\Services\Atividades\Legado;

use App\Models\AulaAtividade;
use App\Services\Atividades\ContextoAtividade;
use App\Services\Atividades\ResultadoAtividade;
use App\Services\Crianca\TentativaService;
use Illuminate\Validation\ValidationException;
use LogicException;

/**
 * Criação: juntar sílabas (desta aula e das anteriores) para formar palavras.
 * Delega a validação a TentativaService, que continua sendo a regra da Teia.
 */
final class MontarPalavras extends Base
{
    public function __construct(private readonly TentativaService $tentativas) {}

    public static function tipo(): string
    {
        return 'montar_palavras';
    }

    public static function avaliada(): bool
    {
        return true;
    }

    public function validarConfig(array $config): array
    {
        $minimo = (int) ($config['minimo_palavras'] ?? 1);

        if ($minimo < 0 || $minimo > 20) {
            throw ValidationException::withMessages(['config' => 'minimo_palavras precisa estar entre 0 e 20.']);
        }

        return ['minimo_palavras' => $minimo];
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        return [
            ...$this->recursos($contexto, 'pecas', 'metas'),
            'teia_total' => count($contexto->recurso('teia', [])),
            'minimo_palavras' => (int) ($atividade->configArray()['minimo_palavras'] ?? 1),
        ];
    }

    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade
    {
        if ($contexto->crianca === null) {
            throw new LogicException('montar_palavras precisa de uma criança.');
        }

        $silabas = array_values(array_map('strval', (array) ($resposta['silabas'] ?? [])));
        $tentativa = $this->tentativas->tentar($contexto->crianca, $contexto->aula, $silabas);

        if ($tentativa['valida']) {
            return ResultadoAtividade::acerto(
                $tentativa['nova_na_teia'] ? 'você descobriu uma palavra! ela foi para a sua teia.' : 'essa já está na sua teia!',
                $tentativa['nova_na_teia'] ? (int) config('teia.xp.palavra') : 0,
                'palavra:'.$tentativa['palavra'],
                [],
                $tentativa,
                xpCreditado: true,
            );
        }

        return ResultadoAtividade::erro('não foi dessa vez.', $tentativa['dica'], null, 'palavra', [], $tentativa);
    }
}
