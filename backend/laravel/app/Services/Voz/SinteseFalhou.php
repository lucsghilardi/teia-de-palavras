<?php

namespace App\Services\Voz;

use RuntimeException;

/** O provedor não devolveu áudio (rede, cota, chave inválida, resposta vazia). */
class SinteseFalhou extends RuntimeException {}
