<?php

namespace App\Services\Atividades;

use App\Models\AulaAtividade;
use Illuminate\Validation\ValidationException;

/**
 * Um tipo de atividade. O registro (RegistroAtividades) liga o `tipo` gravado
 * em aula_atividades à classe que sabe validar o config do CMS, montar o
 * conteúdo para a criança (sem nunca vazar a resposta) e avaliar a resposta.
 */
interface AvaliadorAtividade
{
    public static function tipo(): string;

    /** Pede resposta da criança? Tipos só de leitura (história, ficha) devolvem false. */
    public static function avaliada(): bool;

    /**
     * Normaliza e valida o config vindo do CMS. Devolve o config normalizado.
     *
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     *
     * @throws ValidationException
     */
    public function validarConfig(array $config): array;

    /**
     * Conteúdo da atividade como o app da criança precisa. NUNCA inclui a
     * resposta correta.
     *
     * @return array<string, mixed>
     */
    public function montar(AulaAtividade $atividade, ContextoAtividade $contexto): array;

    /**
     * Avalia a resposta da criança. Só para tipos avaliados.
     *
     * @param  array<string, mixed>  $config  config normalizado
     * @param  array<string, mixed>  $resposta  corpo enviado pela criança
     */
    public function avaliar(array $config, array $resposta, ContextoAtividade $contexto): ResultadoAtividade;
}
