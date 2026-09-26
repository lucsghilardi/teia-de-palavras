<?php

namespace App\Services\Atividades;

/**
 * Resultado de uma resposta. Nunca carrega "errado": quem erra recebe uma
 * mensagem curta e uma dica; na segunda tentativa, a resposta correta.
 */
final class ResultadoAtividade
{
    /**
     * @param  list<array{chave: string, disciplina: string, dados: array<string, mixed>}>  $itensRevisao
     * @param  array<string, mixed>  $extra  campos específicos do tipo (ex.: a tentativa completa de montar_palavras)
     */
    public function __construct(
        public readonly bool $correta,
        public readonly string $mensagem,
        public readonly ?string $dica = null,
        public readonly mixed $respostaCorreta = null,
        public readonly int $xp = 0,
        public readonly array $itensRevisao = [],
        public readonly array $extra = [],
        public readonly string $item = 'unico',
    ) {}

    public static function acerto(string $mensagem, int $xp = 1, string $item = 'unico', array $itensRevisao = [], array $extra = []): self
    {
        return new self(true, $mensagem, null, null, $xp, $itensRevisao, $extra, $item);
    }

    public static function erro(string $mensagem, ?string $dica, mixed $respostaCorreta = null, string $item = 'unico', array $itensRevisao = [], array $extra = []): self
    {
        return new self(false, $mensagem, $dica, $respostaCorreta, 0, $itensRevisao, $extra, $item);
    }

    /** Mesmo resultado, sem a resposta correta (primeira tentativa). */
    public function semRespostaCorreta(): self
    {
        return new self($this->correta, $this->mensagem, $this->dica, null, $this->xp, $this->itensRevisao, $this->extra, $this->item);
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'correta' => $this->correta,
            'item' => $this->item,
            'mensagem' => $this->mensagem,
            'dica' => $this->dica,
            'resposta_correta' => $this->respostaCorreta,
            'xp_ganho' => $this->xp,
            'extra' => (object) $this->extra,
        ];
    }
}
