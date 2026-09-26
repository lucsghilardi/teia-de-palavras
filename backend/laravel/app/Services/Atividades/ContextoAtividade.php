<?php

namespace App\Services\Atividades;

use App\Models\Aula;
use App\Models\Crianca;
use App\Services\Audio\ResolverAudio;

/**
 * O que um avaliador precisa saber além do config: a criança (null no painel
 * ou na Roda sem criança), a aula, o resolvedor de áudio, os recursos de
 * Português já montados pela aula (peças, metas, Teia, palmas, ficha,
 * história, perguntas, palavrinhas) e uma semente determinística para
 * embaralhar (mesma ordem numa mesma sessão, ordem nova no dia seguinte).
 */
final class ContextoAtividade
{
    /** @param array<string, mixed> $recursos */
    public function __construct(
        public readonly ?Crianca $crianca,
        public readonly Aula $aula,
        public readonly ResolverAudio $audio,
        public readonly array $recursos = [],
        public readonly int $semente = 0,
    ) {}

    public function recurso(string $chave, mixed $padrao = null): mixed
    {
        return $this->recursos[$chave] ?? $padrao;
    }

    /** Semente estável por criança, aula, atividade e dia. */
    public static function semente(?Crianca $crianca, Aula $aula, int $ordem): int
    {
        return crc32(sprintf('%d|%d|%d|%s', $crianca?->id ?? 0, $aula->id, $ordem, now()->toDateString()));
    }
}
