<?php

namespace App\Http\Controllers\Api\Crianca;

use App\Http\Controllers\Controller;
use App\Models\AulaPalavra;
use App\Models\TeiaPalavra;
use App\Services\Audio\ResolverAudio;
use App\Support\Midia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** O mural pessoal da criança: as palavras que ela já descobriu. */
class TeiaController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $crianca = $request->user('crianca');
        $audio = ResolverAudio::para($crianca);

        $palavras = TeiaPalavra::query()
            ->where('crianca_id', $crianca->id)
            ->with('aula:id,titulo')
            ->latest('descoberta_em')
            ->latest('id')
            ->get();

        $imagens = AulaPalavra::query()
            ->whereIn('palavra_normalizada', $palavras->pluck('palavra_normalizada'))
            ->whereNotNull('imagem_path')
            ->pluck('imagem_path', 'palavra_normalizada');

        return response()->json([
            'total' => $palavras->count(),
            'palavras' => $palavras->map(fn (TeiaPalavra $t) => [
                'palavra' => $t->palavra_exibida,
                'silabas' => $t->silabas,
                'aula' => $t->aula ? ['id' => $t->aula->id, 'titulo' => $t->aula->titulo] : null,
                'descoberta_em' => $t->descoberta_em,
                'audio_url' => $audio->palavra($t->palavra_exibida),
                'imagem_url' => Midia::url($imagens[$t->palavra_normalizada] ?? null),
            ])->values(),
        ]);
    }
}
