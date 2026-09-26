<?php

namespace App\Services\Palavras;

/**
 * Sugere a família silábica de uma sílaba da palavra geradora (ficha de
 * descoberta). A família é o ataque da sílaba com cada vogal, sem a coda:
 * TE → TA TE TI TO TU; SAL → SA SE SI SO SU; NHA → NHA NHE NHI NHO NHU.
 * Sílaba só de vogal gera as vogais. C e G seguem o som: CA CO CU / CE CI.
 * É só uma sugestão: o educador edita no CMS (ex.: MÁS → MAS MES MIS MOS MUS).
 */
final class SugestorFamilia
{
    private const VOGAIS = ['A', 'E', 'I', 'O', 'U'];

    /** @return list<string> */
    public static function para(string $silaba): array
    {
        [$ataque, $vogal] = Silabador::partes($silaba);

        if ($vogal === '') {
            return [];
        }

        $suave = in_array($vogal, ['E', 'I'], true);

        return match ($ataque) {
            '' => self::VOGAIS,
            'C' => $suave ? ['CE', 'CI'] : ['CA', 'CO', 'CU'],
            'G' => $suave ? ['GE', 'GI'] : ['GA', 'GO', 'GU'],
            'Ç' => ['ÇA', 'ÇO', 'ÇU'],
            'QU' => $suave ? ['QUE', 'QUI'] : ['QUA', 'QUO'],
            'GU' => ['GUE', 'GUI'],
            default => array_map(fn (string $v) => $ataque.$v, self::VOGAIS),
        };
    }
}
