<?php

namespace App\Services\Atividades\Suporte;

/**
 * Embaralha de forma determinística: a mesma semente dá a mesma ordem, então
 * a criança vê as opções na mesma posição enquanto está na atividade e o
 * servidor consegue reproduzir o que ela viu.
 */
final class Embaralhador
{
    /**
     * @template T
     *
     * @param  list<T>  $itens
     * @return list<T>
     */
    public static function embaralhar(array $itens, int $semente): array
    {
        $lista = array_values($itens);
        $n = count($lista);
        $estado = ($semente & 0x7FFFFFFF) ?: 1;

        for ($i = $n - 1; $i > 0; $i--) {
            // Gerador congruencial linear simples (independente do PHP e da plataforma).
            $estado = (int) ((1103515245 * $estado + 12345) % 2147483648);
            $j = $estado % ($i + 1);
            [$lista[$i], $lista[$j]] = [$lista[$j], $lista[$i]];
        }

        return $lista;
    }

    /**
     * Embaralha garantindo que a ordem mude (quando há mais de um item
     * distinto): útil em "ordenar", onde a ordem certa não pode aparecer pronta.
     *
     * @template T
     *
     * @param  list<T>  $itens
     * @return list<T>
     */
    public static function embaralharDiferente(array $itens, int $semente): array
    {
        $original = array_values($itens);

        if (count(array_unique(array_map('serialize', $original))) < 2) {
            return $original;
        }

        for ($tentativa = 0; $tentativa < 8; $tentativa++) {
            $nova = self::embaralhar($original, $semente + $tentativa);

            if ($nova !== $original) {
                return $nova;
            }
        }

        // Rotação simples como último recurso.
        return [...array_slice($original, 1), $original[0]];
    }

    /** Identificador curto e estável de um item/opção (não revela a posição original). */
    public static function id(string ...$partes): string
    {
        return substr(md5(implode('|', $partes)), 0, 6);
    }
}
