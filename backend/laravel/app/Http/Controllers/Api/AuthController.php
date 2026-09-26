<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Exceptions\JWTException;

/**
 * Sessão do adulto (educador/admin) no painel. Guard `api` (JWT).
 * A criança tem fluxo próprio (guard `crianca`), sem e-mail nem senha.
 */
class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $credentials['email'] = Str::lower(trim($credentials['email']));
        $throttleKey = $this->throttleKey($credentials['email'], $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            return response()->json([
                'message' => 'Muitas tentativas de login. Tente novamente em alguns minutos.',
                'retry_after' => RateLimiter::availableIn($throttleKey),
            ], 429);
        }

        $token = Auth::guard('api')->attempt([...$credentials, 'is_active' => true]);

        if (! $token) {
            RateLimiter::hit($throttleKey, 300);

            return response()->json(['message' => 'Email ou senha invalidos.'], 401);
        }

        RateLimiter::clear($throttleKey);

        return $this->respostaComToken($token);
    }

    /**
     * Troca um token vencido (dentro da janela de refresh_ttl) por um novo.
     * Chamado pelo proxy do Next ao receber 401; o antigo entra na blacklist.
     */
    public function refresh(): JsonResponse
    {
        $guard = Auth::guard('api');

        try {
            $novo = $guard->refresh();
        } catch (JWTException) {
            return response()->json(['message' => 'Sessao expirada.'], 401);
        }

        /** @var User|null $user */
        $user = $guard->setToken($novo)->user();

        if (! $user?->is_active) {
            $guard->invalidate();

            return response()->json(['message' => 'Sessao invalida para este usuario.'], 401);
        }

        return $this->respostaComToken($novo);
    }

    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = auth('api')->user();

        return response()->json($user);
    }

    public function logout(): JsonResponse
    {
        Auth::guard('api')->logout();

        return response()->json(['message' => 'Sessao encerrada com sucesso.']);
    }

    private function respostaComToken(string $token): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => Auth::guard('api')->factory()->getTTL() * 60,
        ]);
    }

    private function throttleKey(string $email, ?string $ipAddress): string
    {
        return sprintf('login:%s|%s', Str::lower($email), $ipAddress ?? 'unknown');
    }
}
