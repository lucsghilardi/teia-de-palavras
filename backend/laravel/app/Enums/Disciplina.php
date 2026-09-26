<?php

namespace App\Enums;

/**
 * As disciplinas da plataforma. Não há tabela: ninguém edita disciplinas no
 * CMS, e os dados de exibição (nome, cor, ícone) ficam em config/disciplinas.php.
 */
enum Disciplina: string
{
    case Portugues = 'portugues';
    case Matematica = 'matematica';
    case Geografia = 'geografia';
    case Historia = 'historia';

    /** @return list<string> */
    public static function chaves(): array
    {
        return array_map(fn (self $d) => $d->value, self::cases());
    }

    /** @return list<self> na ordem em que aparecem para a criança */
    public static function ordenadas(): array
    {
        $casos = self::cases();
        usort($casos, fn (self $a, self $b) => $a->ordem() <=> $b->ordem());

        return $casos;
    }

    public static function padrao(): self
    {
        return self::Portugues;
    }

    public function nome(): string
    {
        return (string) $this->dado('nome', ucfirst($this->value));
    }

    public function cor(): string
    {
        return (string) $this->dado('cor', '#22d3ee');
    }

    public function icone(): string
    {
        return (string) $this->dado('icone', 'orbit');
    }

    public function descricao(): string
    {
        return (string) $this->dado('descricao', '');
    }

    public function ordem(): int
    {
        return (int) $this->dado('ordem', 99);
    }

    /** Só Português trabalha com palavra geradora, sílabas e Teia. */
    public function temPalavraGeradora(): bool
    {
        return (bool) $this->dado('tem_palavra_geradora', false);
    }

    /** @return array{chave: string, nome: string, cor: string, icone: string, ordem: int} */
    public function toArray(): array
    {
        return [
            'chave' => $this->value,
            'nome' => $this->nome(),
            'cor' => $this->cor(),
            'icone' => $this->icone(),
            'ordem' => $this->ordem(),
        ];
    }

    private function dado(string $campo, mixed $padrao): mixed
    {
        return config("disciplinas.{$this->value}.{$campo}", $padrao);
    }
}
