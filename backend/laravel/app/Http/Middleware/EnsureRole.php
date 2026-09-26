<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe a rota a um ou mais papéis do adulto: `role:admin`, `role:admin,educador`.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$papeis): Response
    {
        $user = $request->user('api');

        if (! $user || ! in_array($user->role, $papeis, true)) {
            return new JsonResponse(['message' => 'Sem permissao para esta acao.'], 403);
        }

        return $next($request);
    }
}
