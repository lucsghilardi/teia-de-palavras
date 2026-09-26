<?php

namespace App\Http\Controllers\Api\Painel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Painel\ConfiguracoesRequest;
use App\Models\Configuracao;
use Illuminate\Http\JsonResponse;

/** Nome do herói, da fábrica, tempo até sugerir pausa e texto do consentimento. */
class ConfiguracaoController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json($this->payload());
    }

    public function update(ConfiguracoesRequest $request): JsonResponse
    {
        foreach ($request->validated() as $chave => $valor) {
            Configuracao::definir($chave, (string) $valor);
        }

        return response()->json($this->payload());
    }

    /** @return array<string, mixed> */
    private function payload(): array
    {
        $todas = Configuracao::todas();

        return [
            'heroi_nome' => $todas['heroi_nome'],
            'fabrica_nome' => $todas['fabrica_nome'],
            'minutos_pausa' => (int) $todas['minutos_pausa'],
            'consentimento_versao' => $todas['consentimento_versao'],
            'consentimento_texto' => $todas['consentimento_texto'],
        ];
    }
}
