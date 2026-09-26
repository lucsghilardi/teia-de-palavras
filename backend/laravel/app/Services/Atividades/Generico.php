<?php

namespace App\Services\Atividades;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * Base dos tipos genéricos (config em JSON, avaliados no servidor).
 * Regras do config em `regras()`; o resto é específico de cada tipo.
 */
abstract class Generico implements AvaliadorAtividade
{
    public static function avaliada(): bool
    {
        return true;
    }

    /** @return array<string, mixed> regras do Validator para o config */
    abstract protected function regras(): array;

    public function validarConfig(array $config): array
    {
        $validador = Validator::make($config, $this->regras(), [], $this->nomes());

        if ($validador->fails()) {
            throw new ValidationException($validador);
        }

        return $this->normalizar($validador->validated());
    }

    /**
     * Ajustes depois da validação (ex.: garantir a opção correta na lista).
     *
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    protected function normalizar(array $config): array
    {
        return $config;
    }

    /** @return array<string, string> */
    protected function nomes(): array
    {
        return [];
    }

    /** @param array<string, mixed> $resposta */
    protected function texto(array $resposta, string $chave): string
    {
        return trim((string) ($resposta[$chave] ?? ''));
    }
}
