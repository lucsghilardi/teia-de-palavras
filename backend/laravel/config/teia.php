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
    // XP (pontos) por conquista. Atividades genéricas: só no primeiro acerto de cada item.
    'xp' => [
        'palavra' => 1,
        'producao' => 1,
        'missao' => 3,
        'atividade_item' => 1,
        'revisao_item' => 1,
    ],

    // Mini-aulas gravadas pelas crianças (ensino entre pares).
    'mini_aulas' => [
        'por_dia' => (int) env('TEIA_MINI_AULAS_POR_DIA', 10),
        'duracao_max_s' => (int) env('TEIA_MINI_AULAS_DURACAO_MAX_S', 60),
        'tamanho_max_kb' => (int) env('TEIA_MINI_AULAS_TAMANHO_MAX_KB', 2048),
        'mimes' => ['webm', 'weba', 'mp4', 'm4a', 'ogg', 'oga', 'opus', 'mp3', 'wav'],
        'xp_dada' => 3,            // autora, quando um adulto aprova
        'xp_respondida' => 1,      // quem responde certo
        'xp_autora_por_acerto' => 1,
        'teto_xp_autora' => 10,    // por mini-aula, somando os acertos dos amigos
        'amizade_dias' => 7,       // validade do código de amizade
    ],

    // Política de feedback: dica no 1º erro; a partir do 2º, a resposta certa.
    'tentativas_ate_resposta' => 2,

    // Nível pela tabela de XP acumulado: nível N = quantos limiares o XP já passou.
    'niveis' => [0, 10, 25, 45, 70, 100, 140, 190, 250, 320, 400, 500, 620, 760, 920, 1100],

    // Revisão espaçada (caixas de Leitner): intervalo em dias de cada caixa.
    'revisao' => [
        'intervalos_dias' => [0, 1, 3, 7, 14, 30],
        'itens_por_sessao' => 6,
        'caixa_dominada' => 4,
    ],
];
