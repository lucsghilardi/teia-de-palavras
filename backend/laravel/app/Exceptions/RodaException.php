<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

/** Regra da Roda violada: vira JSON `{ message }` com o status certo (403, 404, 409, 422). */
class RodaException extends HttpException
{
    public function __construct(string $mensagem, int $status = 422)
    {
        parent::__construct($status, $mensagem);
    }
}
