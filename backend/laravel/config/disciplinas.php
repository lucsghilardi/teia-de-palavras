<?php

/*
| Disciplinas (os "planetas" da Galáxia). A chave é o valor do enum
| App\Enums\Disciplina e o que fica gravado em aulas.disciplina.
*/
return [
    'portugues' => [
        'nome' => 'Português',
        'cor' => '#a78bfa',
        'icone' => 'book-open',
        'ordem' => 1,
        'tem_palavra_geradora' => true,
        'descricao' => 'Ler e escrever: palavras geradoras, famílias silábicas, frases e a Teia de Palavras.',
    ],
    'matematica' => [
        'nome' => 'Matemática',
        'cor' => '#22d3ee',
        'icone' => 'calculator',
        'ordem' => 2,
        'tem_palavra_geradora' => false,
        'descricao' => 'Contar, comparar, somar e subtrair até 100, dinheiro, formas e tempo (BNCC 2º ano).',
    ],
    'geografia' => [
        'nome' => 'Geografia',
        'cor' => '#34d399',
        'icone' => 'map',
        'ordem' => 3,
        'tem_palavra_geradora' => false,
        'descricao' => 'Casa, rua, bairro, mapas simples, campo e cidade, dia e noite (BNCC 2º ano).',
    ],
    'historia' => [
        'nome' => 'História',
        'cor' => '#fbbf24',
        'icone' => 'hourglass',
        'ordem' => 4,
        'tem_palavra_geradora' => false,
        'descricao' => 'Antes e depois, linha do tempo, família, comunidade e trabalhos (BNCC 2º ano).',
    ],
];
