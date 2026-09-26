<?php

namespace App\Services\Palavras;

/**
 * Resultado de uma tentativa de formar palavra. Nunca carrega "errado":
 * inválida vem com uma dica gentil para a criança.
 */
final class ResultadoValidacao
{
    public const VALIDA = 'valida';

    public const QUASE = 'quase';

    public const AGUARDANDO_APROVACAO = 'aguardando_aprovacao';

    public const DESCONHECIDA = 'desconhecida';

    public const SILABA_INDISPONIVEL = 'silaba_indisponivel';

    /** @param list<string> $silabas */
    private function __construct(
        public readonly bool $valida,
        public readonly string $tipo,
        public readonly string $palavraNormalizada,
        public readonly array $silabas,
        public readonly ?string $palavraExibida = null,
        public readonly bool $novaNaTeia = false,
        public readonly ?string $dica = null,
        public readonly ?string $origem = null,
    ) {}

    /** @param list<string> $silabas */
    public static function valida(string $normalizada, array $silabas, string $exibida, bool $novaNaTeia, string $origem): self
    {
        return new self(true, self::VALIDA, $normalizada, $silabas, $exibida, $novaNaTeia, null, $origem);
    }

    /** @param list<string> $silabas */
    public static function invalida(string $tipo, string $normalizada, array $silabas, string $dica): self
    {
        return new self(false, $tipo, $normalizada, $silabas, null, false, $dica);
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'valida' => $this->valida,
            'tipo' => $this->tipo,
            'palavra' => $this->palavraExibida,
            'silabas' => $this->silabas,
            'nova_na_teia' => $this->novaNaTeia,
            'dica' => $this->dica,
        ];
    }
}
