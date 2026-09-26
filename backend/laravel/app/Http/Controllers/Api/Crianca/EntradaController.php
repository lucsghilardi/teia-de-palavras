<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Http\Resources\OpcaoVisualResource;
use App\Models\Crianca;
use App\Models\OpcaoVisual;
use App\Models\Turma;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Exceptions\JWTException;

/**
 * Entrada da criança sem senha digitada: código da turma (digitado uma vez pelo
 * adulto no dispositivo) → avatar → figura secreta. Mensagens gentis, que o
 * app fala em voz alta.
 */
class EntradaController extends Controller
{
    public function turma(string $codigo): JsonResponse
    {
        $turma = Turma::where('codigo', Turma::normalizarCodigo($codigo))->where('ativa', true)->first();

        if ($turma === null) {
            return response()->json(['message' => 'Não achei essa turma. Confira o código com um adulto.'], 404);
        }

        $criancas = $turma->criancas()->with('avatar')->orderBy('apelido')->get();

        return response()->json([
            'turma' => ['nome' => $turma->nome, 'codigo' => $turma->codigo],
            'criancas' => $criancas->map(fn (Crianca $c) => [
                'id' => $c->id,
                'apelido' => $c->apelido,
                'avatar' => $c->avatar ? new OpcaoVisualResource($c->avatar) : null,
            ])->values(),
            'figuras' => OpcaoVisualResource::collection(OpcaoVisual::figuras()->ativas()->get()),
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'codigo_turma' => ['required', 'string', 'max:12'],
            'crianca_id' => ['required', 'integer'],
            'figura_chave' => ['required', 'string', 'max:40'],
        ]);

        $crianca = Crianca::query()
            ->whereKey($dados['crianca_id'])
            ->whereHas('turma', fn ($q) => $q->where('codigo', Turma::normalizarCodigo($dados['codigo_turma']))->where('ativa', true))
            ->first();

        if ($crianca === null) {
            return response()->json(['message' => 'Não achei você nesta turma. Vamos chamar um adulto?'], 404);
        }

        if ($crianca->estaBloqueada()) {
            return $this->bloqueada($crianca);
        }

        if (! $crianca->conferirFiguraSecreta($dados['figura_chave'])) {
            $maximo = (int) config('teia.crianca.tentativas_figura', 5);
            $crianca->tentativas_login_falhas++;

            if ($crianca->tentativas_login_falhas >= $maximo) {
                $crianca->tentativas_login_falhas = 0;
                $crianca->bloqueada_ate = now()->addMinutes((int) config('teia.crianca.bloqueio_minutos', 15));
                $crianca->save();

                return $this->bloqueada($crianca);
            }

            $crianca->save();

            return response()->json([
                'message' => 'Hmm, não é essa figura. Vamos tentar de novo?',
                'tentativas_restantes' => $maximo - $crianca->tentativas_login_falhas,
            ], 422);
        }

        $crianca->forceFill(['tentativas_login_falhas' => 0, 'bloqueada_ate' => null])->save();

        return $this->respostaComToken(Auth::guard('crianca')->setTTL($this->ttl())->login($crianca));
    }

    /** Troca o token vencido (dentro do refresh_ttl) por um novo. Usado pelo proxy do Next. */
    public function refresh(): JsonResponse
    {
        $guard = Auth::guard('crianca');

        try {
            $novo = $guard->setTTL($this->ttl())->refresh();
        } catch (JWTException) {
            return response()->json(['message' => 'Sessao expirada.'], 401);
        }

        $guard->setToken($novo);

        // O refresh do tymon não confere de qual model é o token: sem isto, um
        // token de adulto sairia daqui "renovado" (inútil, mas não deve sair).
        $crianca = $guard->checkSubjectModel(Crianca::class)
            ? Crianca::with('turma')->find($guard->payload()->get('sub'))
            : null;

        if ($crianca === null || ! $crianca->turma?->ativa) {
            $guard->invalidate();

            return response()->json(['message' => 'Sessao expirada.'], 401);
        }

        return $this->respostaComToken($novo);
    }

    public function sair(): JsonResponse
    {
        Auth::guard('crianca')->logout();

        return response()->json(['message' => 'Até logo!']);
    }

    private function bloqueada(Crianca $crianca): JsonResponse
    {
        return response()->json([
            'message' => 'Vamos chamar um adulto para ajudar?',
            'bloqueada_ate' => $crianca->bloqueada_ate,
        ], 423);
    }

    private function ttl(): int
    {
        return (int) config('teia.crianca.ttl', 480);
    }

    private function respostaComToken(string $token): JsonResponse
    {
        $resposta = response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => $this->ttl() * 60,
        ]);

        // O TTL é global na fábrica do tymon: volta ao do adulto para não vazar.
        Auth::guard('crianca')->setTTL((int) config('jwt.ttl', 60));

        return $resposta;
    }
}
