<?php

namespace App\Services\Atividades\Legado;

use App\Models\AulaAtividade;
use App\Services\Atividades\ContextoAtividade;
use App\Services\Atividades\ResultadoAtividade;
use App\Services\Crianca\ProducaoService;
use DomainException;
use Illuminate\Validation\ValidationException;
use LogicException;

/** Produção: montar uma frase curta com as palavras da Teia e as palavrinhas. */
final class Frase extends Base
{
    public function __construct(private readonly ProducaoService $producoes) {}

    public static function tipo(): string
    {
        return 'frase';
    }

    public static function avaliada(): bool
    {
        return true;
    }

    public function validarConfig(array $config): array
    {
        $minimo = (int) ($config['minimo'] ?? 2);

        if ($minimo < 2 || $minimo > 8) {
            throw ValidationException::withMessages(['config' => 'minimo precisa estar entre 2 e 8.']);
        }

        return ['minimo' => $minimo];
    }

    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array
    {
        return [
            ...$this->recursos($contexto, 'teia', 'palavrinhas'),
            'minimo' => (int) ($atividade->configArray()['minimo'] ?? 2),
        ];
    }

    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade
    {
        if ($contexto->crianca === null) {
            throw new LogicException('frase precisa de uma criança.');
        }

        $palavras = array_values(array_map('strval', (array) ($resposta['palavras'] ?? [])));

        try {
            $producao = $this->producoes->registrar($contexto->crianca, $contexto->aula, $palavras);
        } catch (DomainException $e) {
            return ResultadoAtividade::erro('ainda não deu.', $e->getMessage(), null, 'frase');
        }

        return ResultadoAtividade::acerto('você escreveu uma frase!', 0, 'frase', [], $producao, xpCreditado: true);
    }
}
