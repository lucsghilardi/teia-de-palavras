<?php

/*
| Regras ajustáveis do app da criança.
*/
return [
    'crianca' => [
        // Duração do token da criança (minutos): uma manhã inteira de aula.
        'ttl' => (int) env('JWT_CRIANCA_TTL', 480),
        // Erros seguidos de figura secreta até bloquear a entrada.
        'tentativas_figura' => 5,
        'bloqueio_minutos' => 15,
    ],

    'sessao' => [
        // Sem pulso por mais que isto, a sessão acaba e a próxima atividade abre outra.
        'inatividade_minutos' => 10,
    ],

    // Palavrinhas de ligação oferecidas na etapa de Produção (frase).
    'palavrinhas' => ['O', 'A', 'E', 'É', 'UM', 'UMA', 'NO', 'NA', 'DO', 'DA', 'TEM', 'COM'],

    // Estrelas (XP) são só da criança: nunca há ranking ou comparação.
    'estrelas' => [
        'palavra' => 1,
        'producao' => 1,
        'missao' => 3,
    ],

    // XP das atividades genéricas: só no primeiro acerto de cada item.
    'xp' => [
        'atividade_item' => 1,
    ],

    // Política de feedback: dica no 1º erro; a partir do 2º, a resposta certa.
    'tentativas_ate_resposta' => 2,
];
