<?php

namespace App\Services\Palavras;

/**
 * Separação silábica heurística do português, suficiente para sugerir as
 * sílabas de uma palavra no CMS (o educador sempre pode corrigir).
 *
 * Regras:
 *  - dígrafos NH, LH, CH são uma consoante só; QU e GU seguidos de vogal também;
 *  - vogais seguidas de I/U sem acento formam ditongo (TEI-A, HE-RÓI, PA-PAI);
 *    antes de NH é hiato (RA-I-NHA); ÃO, ÃE, ÕE são ditongos nasais;
 *  - entre vogais: 1 consoante vai para a sílaba seguinte (BO-NE-CA);
 *    2 consoantes se separam (SAL-VA, MÁS-CA-RA), salvo grupo inseparável
 *    (FÁ-BRI-CA); 3+ deixam o grupo inseparável ou a última para a seguinte.
 */
final class Silabador
{
    private const VOGAIS = ['A', 'E', 'I', 'O', 'U', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Â', 'Ê', 'Ô', 'Ã', 'Õ', 'À'];

    private const DIGRAFOS = ['NH', 'LH', 'CH'];

    private const GRUPOS_INSEPARAVEIS = [
        'BR', 'CR', 'DR', 'FR', 'GR', 'PR', 'TR', 'VR',
        'BL', 'CL', 'FL', 'GL', 'PL', 'TL',
    ];

    /** @return list<string> */
    public static function separar(string $palavra): array
    {
        $tokens = self::tokenizar(mb_strtoupper(trim($palavra), 'UTF-8'));

        if ($tokens === []) {
            return [];
        }

        $nucleos = self::nucleos($tokens);

        if ($nucleos === []) {
            return [implode('', array_column($tokens, 'v'))];
        }

        // Fronteiras: índice do token onde cada sílaba começa.
        $inicios = [0];

        for ($n = 0; $n < count($nucleos) - 1; $n++) {
            $fimAtual = $nucleos[$n][1];
            $inicioProximo = $nucleos[$n + 1][0];
            $consoantes = array_column(array_slice($tokens, $fimAtual + 1, $inicioProximo - $fimAtual - 1), 'v');
            $qtd = count($consoantes);

            if ($qtd <= 1) {
                $corte = $fimAtual + 1;
            } elseif ($qtd === 2) {
                $corte = in_array($consoantes[0].$consoantes[1], self::GRUPOS_INSEPARAVEIS, true)
                    ? $fimAtual + 1
                    : $fimAtual + 2;
            } else {
                $ultimasDuas = $consoantes[$qtd - 2].$consoantes[$qtd - 1];
                $corte = in_array($ultimasDuas, self::GRUPOS_INSEPARAVEIS, true)
                    ? $inicioProximo - 2
                    : $inicioProximo - 1;
            }

            $inicios[] = $corte;
        }

        $silabas = [];

        foreach ($inicios as $i => $inicio) {
            $fim = $inicios[$i + 1] ?? count($tokens);
            $silabas[] = implode('', array_column(array_slice($tokens, $inicio, $fim - $inicio), 'v'));
        }

        return $silabas;
    }

    /**
     * Divide uma sílaba em ataque (consoantes antes da vogal), vogal (sem
     * acento) e coda. Ex.: "BRIN" → ['BR', 'I', 'N']; "QUE" → ['QU', 'E', ''].
     *
     * @return array{0: string, 1: string, 2: string}
     */
    public static function partes(string $silaba): array
    {
        $tokens = self::tokenizar(mb_strtoupper(trim($silaba), 'UTF-8'));
        $ataque = '';
        $i = 0;

        while ($i < count($tokens) && $tokens[$i]['t'] === 'C') {
            $ataque .= $tokens[$i]['v'];
            $i++;
        }

        $vogal = isset($tokens[$i]) ? self::semAcento($tokens[$i]['v']) : '';
        $coda = implode('', array_column(array_slice($tokens, $i + 1), 'v'));

        return [$ataque, $vogal, $coda];
    }

    public static function ehVogal(string $letra): bool
    {
        return in_array($letra, self::VOGAIS, true);
    }

    public static function semAcento(string $letra): string
    {
        return strtr($letra, ['Á' => 'A', 'À' => 'A', 'Â' => 'A', 'Ã' => 'A', 'É' => 'E', 'Ê' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ô' => 'O', 'Õ' => 'O', 'Ú' => 'U']);
    }

    /** @return list<array{t: 'C'|'V', v: string}> */
    private static function tokenizar(string $palavra): array
    {
        $letras = mb_str_split(preg_replace('/[^\p{L}]/u', '', $palavra) ?? '');
        $tokens = [];
        $total = count($letras);

        for ($i = 0; $i < $total;) {
            $c = $letras[$i];
            $n = $letras[$i + 1] ?? '';
            $nn = $letras[$i + 2] ?? '';

            if (in_array($c.$n, self::DIGRAFOS, true)) {
                $tokens[] = ['t' => 'C', 'v' => $c.$n];
                $i += 2;

                continue;
            }

            if (($c === 'Q' || $c === 'G') && $n === 'U' && $nn !== '' && self::ehVogal($nn)) {
                $tokens[] = ['t' => 'C', 'v' => $c.$n];
                $i += 2;

                continue;
            }

            $tokens[] = ['t' => self::ehVogal($c) ? 'V' : 'C', 'v' => $c];
            $i++;
        }

        return $tokens;
    }

    /**
     * Agrupa vogais em núcleos silábicos. Cada núcleo é [índice inicial, índice final].
     *
     * @param  list<array{t: string, v: string}>  $tokens
     * @return list<array{0: int, 1: int}>
     */
    private static function nucleos(array $tokens): array
    {
        $nucleos = [];
        $total = count($tokens);

        for ($i = 0; $i < $total; $i++) {
            if ($tokens[$i]['t'] !== 'V') {
                continue;
            }

            $anterior = $nucleos === [] ? null : $nucleos[count($nucleos) - 1];

            if ($anterior !== null && $anterior[1] === $i - 1 && self::formaDitongo($tokens, $anterior, $i)) {
                $nucleos[count($nucleos) - 1][1] = $i;

                continue;
            }

            $nucleos[] = [$i, $i];
        }

        return $nucleos;
    }

    /**
     * @param  list<array{t: string, v: string}>  $tokens
     * @param  array{0: int, 1: int}  $nucleo
     */
    private static function formaDitongo(array $tokens, array $nucleo, int $i): bool
    {
        // Só ditongos de duas vogais.
        if ($nucleo[1] - $nucleo[0] >= 1) {
            return false;
        }

        $anterior = $tokens[$nucleo[1]]['v'];
        $atual = $tokens[$i]['v'];

        // Nasais: ÃO, ÃE, ÕE.
        if (in_array($anterior, ['Ã', 'Õ'], true) && in_array($atual, ['O', 'E'], true)) {
            return true;
        }

        if (! in_array($atual, ['I', 'U'], true)) {
            return false;
        }

        // I/U antes de NH é hiato (RA-I-NHA).
        if (($tokens[$i + 1]['v'] ?? null) === 'NH') {
            return false;
        }

        // II, UU não formam ditongo.
        return self::semAcento($anterior) !== $atual;
    }
}
