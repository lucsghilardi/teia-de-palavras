<?php

/*
| Em dev e prod o navegador fala com a API pelo proxy do Next (mesma origem),
| então o CORS só importa para chamadas diretas. Origens vêm de FRONTEND_URL
| (várias separadas por vírgula).
*/
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', (string) env('FRONTEND_URL', ''))))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
