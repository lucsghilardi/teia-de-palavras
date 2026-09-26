<?php

use App\Services\Palavras\Silabador;
use App\Services\Palavras\SugestorFamilia;
use App\Support\Texto;

it('separa as palavras geradoras e do escopo em sílabas', function (string $palavra, string $esperado) {
    expect(implode('-', Silabador::separar($palavra)))->toBe($esperado);
})->with([
    ['TEIA', 'TEI-A'], ['BONECA', 'BO-NE-CA'], ['PULO', 'PU-LO'], ['MOLA', 'MO-LA'],
    ['SALVA', 'SAL-VA'], ['ARANHA', 'A-RA-NHA'], ['HERÓI', 'HE-RÓI'], ['FÁBRICA', 'FÁ-BRI-CA'],
    ['MÁSCARA', 'MÁS-CA-RA'], ['BRINQUEDO', 'BRIN-QUE-DO'], ['PIPOCA', 'PI-PO-CA'],
    ['TIA', 'TI-A'], ['BONÉ', 'BO-NÉ'], ['PIANO', 'PI-A-NO'], ['LUA', 'LU-A'], ['PAPAI', 'PA-PAI'],
    ['RAINHA', 'RA-I-NHA'], ['ÁGUA', 'Á-GUA'], ['CONTRA', 'CON-TRA'], ['CARRO', 'CAR-RO'],
    ['PASSARINHO', 'PAS-SA-RI-NHO'], ['SAÚDE', 'SA-Ú-DE'], ['MINHOCA', 'MI-NHO-CA'], ['QUIABO', 'QUI-A-BO'],
]);

it('sugere a família silábica pelo ataque da sílaba', function (string $silaba, array $familia) {
    expect(SugestorFamilia::para($silaba))->toBe($familia);
})->with([
    ['TE', ['TA', 'TE', 'TI', 'TO', 'TU']],
    ['A', ['A', 'E', 'I', 'O', 'U']],
    ['CA', ['CA', 'CO', 'CU']],
    ['CE', ['CE', 'CI']],
    ['SAL', ['SA', 'SE', 'SI', 'SO', 'SU']],
    ['NHA', ['NHA', 'NHE', 'NHI', 'NHO', 'NHU']],
    ['BRI', ['BRA', 'BRE', 'BRI', 'BRO', 'BRU']],
    ['QUE', ['QUE', 'QUI']],
    ['RÓI', ['RA', 'RE', 'RI', 'RO', 'RU']],
]);

it('normaliza sem acento e em caixa alta', function () {
    expect(Texto::normalizar(' boné '))->toBe('BONE')
        ->and(Texto::normalizar('Herói'))->toBe('HEROI')
        ->and(Texto::juntarNormalizado(['FÁ', 'BRI', 'CA']))->toBe('FABRICA')
        ->and(Texto::separarSilabas('bo-ne ca'))->toBe(['BO', 'NE', 'CA']);
});
