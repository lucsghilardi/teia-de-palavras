<?php

namespace App\Services\Crianca;

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\TeiaPalavra;
use App\Services\Audio\ResolverAudio;
use App\Services\Palavras\ResultadoValidacao;
use App\Services\Palavras\TeiaService;
use App\Services\Palavras\ValidadorPalavras;

/**
 * Uma tentativa de formar palavra (etapa de Criação), no app individual ou na
 * Roda: valida, põe na Teia, dá estrela, avalia medalhas e registra o evento.
 */
class TentativaService
{
    public function __construct(
        private readonly ValidadorPalavras $validador,
        private readonly TeiaService $teia,
        private readonly GamificacaoCrianca $gamificacao,
        private readonly SessaoService $sessoes,
    ) {}

    /**
     * @param  list<string>  $silabas
     * @param  list<string>|null  $disponiveis  peças normalizadas; null = famílias acumuladas da criança
     * @param  string  $origem  como a palavra entra na Teia: criacao | dupla
     * @return array<string, mixed> resposta de docs/api-crianca.md (tentativas)
     */
    public function tentar(Crianca $crianca, Aula $aula, array $silabas, ?array $disponiveis = null, string $origem = 'criacao'): array
    {
        $resultado = $disponiveis === null
            ? $this->validador->validar($crianca, $aula, $silabas)
            : $this->validador->validarCom($disponiveis, $aula, $silabas, $crianca);

        $nova = $this->teia->registrar($crianca, $resultado, $aula, $silabas, $origem);
        $stats = $this->gamificacao->darEstrelas($crianca, $nova ? (int) config('teia.estrelas.palavra') : 0);
        $conquistas = $nova ? $this->gamificacao->avaliarConquistas($crianca) : [];

        $this->sessoes->registrar(
            $crianca,
            $resultado->valida ? 'tentativa_valida' : 'tentativa_invalida',
            $aula,
            6,
            ['silabas' => $resultado->silabas, 'tipo' => $resultado->tipo, 'palavra' => $resultado->palavraExibida],
        );

        return $this->resposta($crianca, $resultado, $nova, (int) $stats->xp_total, $conquistas);
    }

    /**
     * @param  list<array<string, string>>  $conquistas
     * @return array<string, mixed>
     */
    public function resposta(Crianca $crianca, ResultadoValidacao $resultado, bool $nova, int $estrelas, array $conquistas): array
    {
        return [
            ...$resultado->toArray(),
            'nova_na_teia' => $nova,
            'audio_url' => $resultado->valida ? ResolverAudio::para($crianca)->palavra($resultado->palavraExibida) : null,
            'teia_total' => TeiaPalavra::where('crianca_id', $crianca->id)->count(),
            'estrelas' => $estrelas,
            'conquistas' => $conquistas,
        ];
    }
}
