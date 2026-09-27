<?php

namespace App\Services\Voz;

use App\Models\Aula;
use App\Models\Configuracao;
use App\Services\Atividades\Suporte\Mensagens;

/**
 * Junta tudo o que a criança pode ouvir vindo do conteúdo (para o comando
 * teia:gerar-vozes aquecer a voz neural antes da primeira criança chegar).
 * Devolve os textos como o app os fala: placeholders já trocados, porque o
 * hash do cache é do texto final.
 *
 * Não entram as strings fixas do front (geradas uma vez no primeiro uso) nem
 * frases montadas na hora com números ou apelidos.
 */
final class ColetorDeFalas
{
    /** Chaves do `config` de atividade cujos valores o app fala. */
    private const CHAVES_FALADAS = ['texto', 'pergunta', 'frase', 'dica', 'explicacao', 'instrucao', 'rotulo', 'palavra', 'de', 'para'];

    /** @return list<string> */
    public function coletar(bool $incluirRascunhos = false): array
    {
        $frases = [...$this->fixas(), ...$this->conquistas()];

        $aulas = Aula::query()
            ->when(! $incluirRascunhos, fn ($q) => $q->publicadas())
            ->with(['silabas.silaba', 'familias.silaba', 'palavras', 'historiaPaginas', 'perguntas', 'atividades'])
            ->get();

        foreach ($aulas as $aula) {
            array_push($frases, ...$this->daAula($aula));
        }

        return array_values(array_unique(array_filter(array_map('trim', $frases), fn ($f) => $f !== '')));
    }

    /** @return list<string> */
    private function fixas(): array
    {
        return [...Mensagens::ACERTO, Mensagens::ERRO, Mensagens::DICA_PADRAO, Mensagens::RESPOSTA];
    }

    /** As três formas que o front fala uma conquista (narrador.ts, tela-conquista.tsx, medalhas.tsx). */
    private function conquistas(): array
    {
        $frases = [];

        foreach ((array) config('conquistas', []) as $c) {
            $titulo = (string) ($c['titulo'] ?? '');
            $descricao = (string) ($c['descricao'] ?? '');
            $frases[] = "Você ganhou uma conquista: {$titulo}!";
            $frases[] = "{$titulo}. {$descricao}";
            $frases[] = "{$titulo}. {$descricao} Ainda por ganhar.";
        }

        return $frases;
    }

    /** @return list<string> */
    private function daAula(Aula $aula): array
    {
        $frases = [(string) $aula->palavra_geradora, (string) $aula->titulo];

        foreach ($aula->silabas as $s) {
            $frases[] = (string) $s->silaba?->texto;
        }

        foreach ($aula->familias as $f) {
            $frases[] = (string) $f->silaba?->texto;
        }

        foreach ($aula->palavras as $p) {
            $frases[] = (string) $p->palavra;
        }

        foreach ($aula->historiaPaginas as $pagina) {
            $frases[] = Configuracao::aplicarPlaceholders((string) $pagina->texto);
        }

        foreach ($aula->perguntas as $pergunta) {
            $frases[] = Configuracao::aplicarPlaceholders((string) $pergunta->texto);
        }

        foreach ($aula->atividades as $atividade) {
            $frases[] = (string) $atividade->instrucao;
            $frases[] = (string) $atividade->titulo;
            $this->doConfig($atividade->configArray(), $frases);
        }

        return $frases;
    }

    /**
     * Percorre o config recursivamente e recolhe as chaves faladas; listas de
     * strings soltas (`conversa.perguntas`) também contam.
     *
     * @param  array<mixed>  $config
     * @param  list<string>  $frases
     */
    private function doConfig(array $config, array &$frases): void
    {
        foreach ($config as $chave => $valor) {
            if (is_array($valor)) {
                $this->doConfig($valor, $frases);
            } elseif (is_string($valor) && (is_int($chave) || in_array($chave, self::CHAVES_FALADAS, true))) {
                $frases[] = Configuracao::aplicarPlaceholders($valor);
            }
        }
    }
}
