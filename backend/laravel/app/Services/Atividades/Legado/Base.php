<?php

namespace App\Services\Atividades\Legado;

use App\Models\AulaAtividade;
use App\Services\Atividades\AvaliadorAtividade;
use App\Services\Atividades\ContextoAtividade;
use App\Services\Atividades\ResultadoAtividade;
use LogicException;

/**
 * Base dos tipos legados de Português: config vazio e conteúdo vindo dos
 * recursos já montados pela aula (MontadorAulaCrianca). Tipos só de leitura
 * não avaliam nada.
 */
abstract class Base implements AvaliadorAtividade
{
    public static function avaliada(): bool
    {
        return false;
    }

    public function validarConfig(array $config): array
    {
        // Sem opções por enquanto: o conteúdo vem das tabelas da aula.
        return [];
    }

    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade
    {
        throw new LogicException(static::tipo().' não recebe resposta.');
    }

    /** @return array<string, mixed> */
    protected function recursos(ContextoAtividade $contexto, string ...$chaves): array
    {
        $saida = [];

        foreach ($chaves as $chave) {
            $saida[$chave] = $contexto->recurso($chave, []);
        }

        return $saida;
    }

    abstract public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array;
}
