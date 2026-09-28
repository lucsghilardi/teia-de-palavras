<?php

namespace App\Services\Atividades\Suporte;

/**
 * Frases de feedback do app da criança (1º ano, 6+): curtas, em minúsculas, nunca
 * "errado". Quem erra recebe uma dica; na segunda vez, a resposta.
 */
final class Mensagens
{
    public const ACERTO = ['isso!', 'boa!', 'mandou bem!', 'certinho!'];

    public const ERRO = 'não foi dessa vez.';

    public const DICA_PADRAO = 'olhe de novo com calma e tente outra opção.';

    public const RESPOSTA = 'a resposta era esta. vamos treinar de novo mais tarde.';

    public static function acerto(int $semente = 0): string
    {
        return self::ACERTO[abs($semente) % count(self::ACERTO)];
    }
}
