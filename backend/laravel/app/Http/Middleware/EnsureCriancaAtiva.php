<?php

namespace App\Http\Middleware;

use App\Models\Crianca;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * O JWT da criança vale 8 h. Se o educador pausar a turma nesse meio tempo,
 * a próxima requisição já é recusada (criança excluída nem chega aqui: o
 * provider ignora registros apagados).
 */
class EnsureCriancaAtiva
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Crianca|null $crianca */
        $crianca = $request->user('crianca');

        if (! $crianca?->turma()->where('ativa', true)->exists()) {
            Auth::guard('crianca')->logout();

            return new JsonResponse(['message' => 'Sua turma está descansando agora. Chame um adulto.'], 401);
        }

        return $next($request);
    }
}
