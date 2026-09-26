<?php

namespace App\Services\Crianca;

use App\Models\Aula;
use App\Models\Crianca;
use App\Models\Producao;
use App\Models\TeiaPalavra;
use App\Support\Texto;
use DomainException;

/** A frase curta da etapa de Produção (app individual e Roda). */
class ProducaoService
{
    public function __construct(
        private readonly GamificacaoCrianca $gamificacao,
        private readonly SessaoService $sessoes,
    ) {}

    /**
     * @param  list<string>  $palavras
     * @return array{texto: string, estrelas: int, conquistas: list<array<string, string>>}
     *
     * @throws DomainException com mensagem gentil para a criança
     */
    public function registrar(Crianca $crianca, Aula $aula, array $palavras): array
    {
        $palavras = array_values(array_filter(array_map(fn ($p) => mb_strtoupper(trim((string) $p), 'UTF-8'), $palavras)));

        if (count($palavras) < 2) {
            throw new DomainException('Junte pelo menos duas palavras para fazer uma frase!');
        }

        // Só vale o que a criança tinha para tocar: palavras da Teia e palavrinhas.
        $permitidas = TeiaPalavra::where('crianca_id', $crianca->id)->pluck('palavra_normalizada')
            ->concat(array_map([Texto::class, 'normalizar'], config('teia.palavrinhas')))
            ->flip();

        foreach ($palavras as $palavra) {
            if (! $permitidas->has(Texto::normalizar($palavra))) {
                throw new DomainException('Use as palavras da sua teia para montar a frase!');
            }
        }

        $primeiraNestaAula = ! Producao::where('crianca_id', $crianca->id)->where('aula_id', $aula->id)->exists();
        $texto = implode(' ', $palavras);

        Producao::create(['crianca_id' => $crianca->id, 'aula_id' => $aula->id, 'texto' => $texto, 'palavras' => $palavras]);

        $stats = $this->gamificacao->darEstrelas($crianca, $primeiraNestaAula ? (int) config('teia.estrelas.producao') : 0);
        $this->sessoes->registrar($crianca, 'producao', $aula, 7, ['texto' => $texto]);

        return [
            'texto' => $texto,
            'estrelas' => (int) $stats->xp_total,
            'conquistas' => $this->gamificacao->avaliarConquistas($crianca),
        ];
    }
}
