<?php

namespace App\Http\Controllers\Api\Painel;

use App\Http\Controllers\Controller;
use App\Http\Requests\Painel\PalavraRequest;
use App\Http\Resources\PalavraResource;
use App\Models\Palavra;
use App\Services\Palavras\Silabador;
use App\Support\Texto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

/** Dicionário geral de palavras permitidas na etapa de criação. */
class DicionarioController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $busca = Texto::normalizar((string) $request->query('busca', ''));

        $palavras = Palavra::query()
            ->when($busca !== '', fn ($q) => $q->where('palavra_normalizada', 'like', '%'.str_replace(['%', '_'], ['\%', '\_'], $busca).'%'))
            ->when($request->has('aprovada') && $request->query('aprovada') !== '', fn ($q) => $q->where('aprovada', $request->boolean('aprovada')))
            ->orderBy('palavra_normalizada')
            ->limit(500)
            ->get();

        return PalavraResource::collection($palavras);
    }

    public function store(PalavraRequest $request): JsonResponse
    {
        $palavra = mb_strtoupper(trim($request->validated('palavra')), 'UTF-8');
        $normalizada = Texto::normalizar($palavra);

        if (Palavra::where('palavra_normalizada', $normalizada)->exists()) {
            throw ValidationException::withMessages(['palavra' => "A palavra {$palavra} já está no dicionário."]);
        }

        $registro = Palavra::create([
            'palavra' => $palavra,
            'silabas' => $this->silabas($palavra, $request->validated('silabas', [])),
            'origem' => 'cms',
            'aprovada' => $request->boolean('aprovada', true),
            'aprovada_por_user_id' => $request->user()->id,
            'aprovada_em' => now(),
        ]);

        return (new PalavraResource($registro))->response()->setStatusCode(201);
    }

    public function update(PalavraRequest $request, Palavra $palavra): PalavraResource
    {
        $texto = mb_strtoupper(trim($request->validated('palavra')), 'UTF-8');
        $normalizada = Texto::normalizar($texto);

        if (Palavra::where('palavra_normalizada', $normalizada)->whereKeyNot($palavra->id)->exists()) {
            throw ValidationException::withMessages(['palavra' => "A palavra {$texto} já está no dicionário."]);
        }

        $aprovada = $request->boolean('aprovada');

        $palavra->update([
            'palavra' => $texto,
            'silabas' => $this->silabas($texto, $request->validated('silabas', [])),
            'aprovada' => $aprovada,
            'aprovada_por_user_id' => $aprovada ? ($palavra->aprovada ? $palavra->aprovada_por_user_id : $request->user()->id) : null,
            'aprovada_em' => $aprovada ? ($palavra->aprovada_em ?? now()) : null,
        ]);

        return new PalavraResource($palavra);
    }

    public function destroy(Palavra $palavra): Response
    {
        $palavra->delete();

        return response()->noContent();
    }

    /** Uma palavra por linha: "CASA CA-SA" ou só "CASA" (sílabas automáticas). */
    public function importar(Request $request): JsonResponse
    {
        $dados = $request->validate(['texto' => ['required', 'string', 'max:20000']]);

        $importadas = 0;
        $ignoradas = [];

        foreach (preg_split('/\R/u', $dados['texto']) ?: [] as $linha) {
            $linha = trim($linha);

            if ($linha === '') {
                continue;
            }

            $partes = preg_split('/\s+/u', $linha, 2) ?: [];
            $palavra = mb_strtoupper($partes[0] ?? '', 'UTF-8');

            if (! preg_match('/^\p{L}+$/u', $palavra) || mb_strlen($palavra) > 40) {
                $ignoradas[] = ['linha' => $linha, 'motivo' => 'Palavra inválida (use só letras).'];

                continue;
            }

            if (Palavra::where('palavra_normalizada', Texto::normalizar($palavra))->exists()) {
                $ignoradas[] = ['linha' => $linha, 'motivo' => 'Já está no dicionário.'];

                continue;
            }

            try {
                $silabas = $this->silabas($palavra, isset($partes[1]) ? Texto::separarSilabas($partes[1]) : []);
            } catch (ValidationException) {
                $ignoradas[] = ['linha' => $linha, 'motivo' => 'As sílabas não formam a palavra.'];

                continue;
            }

            Palavra::create([
                'palavra' => $palavra,
                'silabas' => $silabas,
                'origem' => 'cms',
                'aprovada' => true,
                'aprovada_por_user_id' => $request->user()->id,
                'aprovada_em' => now(),
            ]);
            $importadas++;
        }

        return response()->json(['importadas' => $importadas, 'ignoradas' => $ignoradas]);
    }

    /**
     * @param  list<string>  $informadas
     * @return list<string>
     */
    private function silabas(string $palavra, array $informadas): array
    {
        $informadas = array_values(array_filter(array_map(fn ($s) => mb_strtoupper(trim((string) $s), 'UTF-8'), $informadas)));

        if ($informadas === []) {
            return Silabador::separar($palavra);
        }

        if (Texto::juntarNormalizado($informadas) !== Texto::normalizar($palavra)) {
            throw ValidationException::withMessages(['silabas' => "As sílabas não formam a palavra {$palavra}."]);
        }

        return $informadas;
    }
}
