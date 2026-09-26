<?php

namespace App\Services\Palavras;

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\CriancaSilaba;
use App\Models\Silaba;
use App\Models\TeiaPalavra;
use Illuminate\Support\Facades\DB;

/**
 * A Teia de Palavras da criança: mural pessoal que só cresce. Cada palavra
 * nova também conta uso para as sílabas (dominada após 3 palavras distintas).
 */
class TeiaService
{
    /**
     * @param  list<string>  $pecasUsadas  textos das peças (catálogo) que a criança juntou
     * @return bool true se a palavra entrou agora na Teia
     */
    public function registrar(Crianca $crianca, ResultadoValidacao $resultado, ?Aula $aula, array $pecasUsadas, string $origem = 'criacao'): bool
    {
        if (! $resultado->valida) {
            return false;
        }

        return DB::transaction(function () use ($crianca, $resultado, $aula, $pecasUsadas, $origem) {
            $palavra = TeiaPalavra::firstOrCreate(
                ['crianca_id' => $crianca->id, 'palavra_normalizada' => $resultado->palavraNormalizada],
                [
                    'palavra_exibida' => $resultado->palavraExibida,
                    'silabas' => $resultado->silabas,
                    'aula_id' => $aula?->id,
                    'origem' => $origem,
                    'descoberta_em' => now(),
                ],
            );

            if (! $palavra->wasRecentlyCreated) {
                return false;
            }

            $this->contarSilabas($crianca, $pecasUsadas);

            return true;
        });
    }

    /** @param list<string> $pecas */
    private function contarSilabas(Crianca $crianca, array $pecas): void
    {
        $textos = array_values(array_unique(array_map(fn ($p) => mb_strtoupper(trim($p), 'UTF-8'), $pecas)));
        $ids = Silaba::whereIn('texto', $textos)->pluck('id');

        foreach ($ids as $silabaId) {
            $existe = CriancaSilaba::where('crianca_id', $crianca->id)->where('silaba_id', $silabaId)->exists();

            if (! $existe) {
                CriancaSilaba::create([
                    'crianca_id' => $crianca->id,
                    'silaba_id' => $silabaId,
                    'vezes_usada' => 1,
                    'primeira_vez_em' => now(),
                ]);

                continue;
            }

            DB::table('crianca_silabas')
                ->where('crianca_id', $crianca->id)
                ->where('silaba_id', $silabaId)
                ->update([
                    'vezes_usada' => DB::raw('vezes_usada + 1'),
                    'dominada_em' => DB::raw(sprintf(
                        'CASE WHEN dominada_em IS NULL AND vezes_usada + 1 >= %d THEN NOW() ELSE dominada_em END',
                        CriancaSilaba::PALAVRAS_PARA_DOMINAR,
                    )),
                    'updated_at' => now(),
                ]);
        }
    }
}
