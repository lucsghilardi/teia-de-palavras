<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Models\Gravacao;
use App\Support\ArquivoPrivado;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Serve uma gravação APROVADA para crianças da mesma turma de quem gravou
 * (a voz gravada substitui a sintetizada). Arquivo sempre no disco privado.
 */
class AudioController extends Controller
{
    public function __invoke(Request $request, Gravacao $gravacao): Response
    {
        $crianca = $request->user('crianca');
        $gravacao->loadMissing('crianca:id,turma_id');

        abort_unless(
            $gravacao->status === Gravacao::APROVADA && $gravacao->crianca?->turma_id === $crianca->turma_id,
            404,
        );

        return ArquivoPrivado::resposta('local', $gravacao->arquivo_path);
    }
}
