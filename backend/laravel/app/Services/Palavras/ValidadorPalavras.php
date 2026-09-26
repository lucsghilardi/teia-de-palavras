<?php

namespace App\Services\Palavras;

use App\Models\Aula;
use App\Models\AulaPalavra;
use App\Models\Crianca;
use App\Models\Palavra;
use App\Models\TeiaPalavra;
use App\Support\Texto;

/**
 * Valida a palavra que a criança montou arrastando sílabas.
 *
 *  1. Toda sílaba usada precisa estar nas famílias acumuladas da criança.
 *  2. A palavra (sem acento, caixa alta) é procurada no dicionário da aula e,
 *     depois, no dicionário geral de palavras aprovadas.
 *  3. Válida → grafia do dicionário (BONE → BONÉ) e se é nova na Teia.
 *     Inválida → dica gentil. Nunca "errado", nunca nota.
 */
class ValidadorPalavras
{
    public const DICAS = [
        ResultadoValidacao::QUASE => 'Quase lá! Que tal colocar mais uma pecinha?',
        ResultadoValidacao::AGUARDANDO_APROVACAO => 'Que palavra interessante! Vou mostrar para o seu educador.',
        ResultadoValidacao::DESCONHECIDA => 'Hum, essa palavra eu ainda não conheço. Vamos tentar outra combinação?',
        ResultadoValidacao::SILABA_INDISPONIVEL => 'Essa pecinha ainda não chegou na sua fábrica. Vamos usar as que você já tem?',
    ];

    public function __construct(private readonly FamiliasService $familias) {}

    /** @param list<string> $silabas sílabas na ordem em que a criança montou */
    public function validar(Crianca $crianca, ?Aula $aula, array $silabas): ResultadoValidacao
    {
        return $this->validarCom($this->familias->textosNormalizados($crianca, $aula), $aula, $silabas, $crianca);
    }

    /**
     * Valida contra um conjunto de peças já conhecido (ex.: peças da Roda).
     *
     * @param  list<string>  $disponiveis  textos normalizados das peças que podiam ser usadas
     * @param  list<string>  $silabas
     */
    public function validarCom(array $disponiveis, ?Aula $aula, array $silabas, ?Crianca $crianca = null): ResultadoValidacao
    {
        $silabas = array_values(array_filter(array_map(
            fn ($s) => mb_strtoupper(trim((string) $s), 'UTF-8'),
            $silabas,
        ), fn (string $s) => $s !== ''));

        $normalizada = Texto::juntarNormalizado($silabas);

        foreach ($silabas as $silaba) {
            if (! in_array(Texto::normalizar($silaba), $disponiveis, true)) {
                return $this->invalida(ResultadoValidacao::SILABA_INDISPONIVEL, $normalizada, $silabas);
            }
        }

        if ($silabas === []) {
            return $this->invalida(ResultadoValidacao::QUASE, $normalizada, $silabas);
        }

        $encontrada = $this->buscar($aula, $normalizada);

        if ($encontrada !== null) {
            [$exibida, $origem] = $encontrada;

            $jaNaTeia = $crianca !== null && TeiaPalavra::query()
                ->where('crianca_id', $crianca->id)
                ->where('palavra_normalizada', $normalizada)
                ->exists();

            return ResultadoValidacao::valida($normalizada, $silabas, $exibida, ! $jaNaTeia, $origem);
        }

        if (Palavra::query()->where('palavra_normalizada', $normalizada)->where('aprovada', false)->exists()) {
            return $this->invalida(ResultadoValidacao::AGUARDANDO_APROVACAO, $normalizada, $silabas);
        }

        if ($this->ehInicioDePalavra($aula, $normalizada)) {
            return $this->invalida(ResultadoValidacao::QUASE, $normalizada, $silabas);
        }

        return $this->invalida(ResultadoValidacao::DESCONHECIDA, $normalizada, $silabas);
    }

    /** @return array{0: string, 1: string}|null [grafia, origem] */
    private function buscar(?Aula $aula, string $normalizada): ?array
    {
        if ($aula !== null) {
            $daAula = AulaPalavra::query()
                ->where('aula_id', $aula->id)
                ->where('palavra_normalizada', $normalizada)
                ->value('palavra');

            if ($daAula !== null) {
                return [$daAula, 'aula'];
            }
        }

        $geral = Palavra::query()->aprovadas()->where('palavra_normalizada', $normalizada)->value('palavra');

        return $geral !== null ? [$geral, 'dicionario'] : null;
    }

    private function ehInicioDePalavra(?Aula $aula, string $normalizada): bool
    {
        $prefixo = str_replace(['%', '_'], ['\%', '\_'], $normalizada).'%';

        $naAula = $aula !== null && AulaPalavra::query()
            ->where('aula_id', $aula->id)
            ->where('palavra_normalizada', 'like', $prefixo)
            ->where('palavra_normalizada', '!=', $normalizada)
            ->exists();

        return $naAula || Palavra::query()->aprovadas()
            ->where('palavra_normalizada', 'like', $prefixo)
            ->where('palavra_normalizada', '!=', $normalizada)
            ->exists();
    }

    /** @param list<string> $silabas */
    private function invalida(string $tipo, string $normalizada, array $silabas): ResultadoValidacao
    {
        return ResultadoValidacao::invalida($tipo, $normalizada, $silabas, self::DICAS[$tipo]);
    }
}
