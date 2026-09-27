<?php

namespace App\Services\Voz;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Voz neural do app da criança: cada frase é sintetizada UMA vez, guardada no
 * disco privado pelo hash do texto e servida em /api/vozes/{hash}.mp3 com
 * cache de um ano. Prioridade do app: gravação aprovada > arquivo da aula >
 * voz neural em cache > voz do navegador.
 *
 * Tetos de custo: tamanho por frase, orçamento mensal de caracteres (contador
 * no Cache; `cache:clear` zera) e, no controller, frases novas por dia.
 */
final class VozService
{
    public const DISCO = 'local';

    public function __construct(private readonly Sintetizador $sintetizador) {}

    public function ativa(): bool
    {
        return $this->sintetizador->ativo();
    }

    /**
     * Espelho de `normalizarParaVoz` em frontend/lib/voz.ts: trim, espaços
     * colapsados e minúsculas (vozes neurais também soletram "TEIA").
     */
    public static function normalizar(string $texto): string
    {
        $limpo = preg_replace('/\s+/u', ' ', trim($texto)) ?? '';

        return mb_strtolower($limpo, 'UTF-8');
    }

    /** Hash do provedor + voz + velocidade + texto: trocar de voz regenera sem purga. */
    public function chave(string $textoNormalizado): string
    {
        return hash('sha256', implode('|', [
            $this->sintetizador->nome(),
            (string) config('teia.voz.nome'),
            (string) config('teia.voz.velocidade'),
            $textoNormalizado,
        ]));
    }

    public static function caminho(string $hash): string
    {
        return 'vozes/'.substr($hash, 0, 2).'/'.$hash.'.mp3';
    }

    /**
     * URL absoluta de APP_URL (como a mídia do CMS), nunca de route()/url():
     * o request chega via proxy com o Host interno do container.
     */
    public static function url(string $hash): string
    {
        return rtrim((string) config('app.url'), '/').'/api/vozes/'.$hash.'.mp3';
    }

    /** URL se o arquivo já existe; nunca gera. */
    public function existente(string $texto): ?string
    {
        $normalizado = self::normalizar($texto);

        if ($normalizado === '') {
            return null;
        }

        $hash = $this->chave($normalizado);

        return Storage::disk(self::DISCO)->exists(self::caminho($hash)) ? self::url($hash) : null;
    }

    /**
     * Gera (se preciso), grava e devolve a URL. null quando inativa, texto
     * vazio ou longo demais, orçamento do mês esgotado ou falha do provedor.
     */
    public function gerar(string $texto): ?string
    {
        $normalizado = self::normalizar($texto);
        $chars = mb_strlen($normalizado);

        if ($chars === 0 || $chars > (int) config('teia.voz.max_chars', 300)) {
            return null;
        }

        $hash = $this->chave($normalizado);
        $caminho = self::caminho($hash);
        $disco = Storage::disk(self::DISCO);

        if ($disco->exists($caminho)) {
            return self::url($hash);
        }

        if (! $this->ativa() || ! $this->cabeNoOrcamento($chars)) {
            return null;
        }

        try {
            $bytes = $this->sintetizador->sintetizar($normalizado);
        } catch (SinteseFalhou $e) {
            Log::warning('Voz neural: falha ao sintetizar.', ['erro' => $e->getMessage(), 'chars' => $chars]);

            return null;
        }

        $disco->put($caminho, $bytes);
        $this->contabilizar($chars);

        return self::url($hash);
    }

    /** Caracteres já gerados neste mês (para o comando de aquecimento e diagnóstico). */
    public static function usoDoMes(): int
    {
        return (int) Cache::get(self::chaveDoMes(), 0);
    }

    private function cabeNoOrcamento(int $chars): bool
    {
        return self::usoDoMes() + $chars <= (int) config('teia.voz.limite_mensal_chars', 900000);
    }

    private function contabilizar(int $chars): void
    {
        $chave = self::chaveDoMes();

        Cache::add($chave, 0, now()->addMonths(2));
        Cache::increment($chave, $chars);
    }

    private static function chaveDoMes(): string
    {
        return 'voz:chars:'.now()->format('Y-m');
    }
}
