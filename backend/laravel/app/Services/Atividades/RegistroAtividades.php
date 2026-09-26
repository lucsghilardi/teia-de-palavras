<?php

namespace App\Services\Atividades;

use InvalidArgumentException;

/**
 * Mapa tipo → avaliador. É a única lista de tipos do sistema: o CMS valida
 * contra ela, o montador e o endpoint de resposta resolvem por ela.
 */
final class RegistroAtividades
{
    /** @var array<string, class-string<AvaliadorAtividade>> */
    public const TIPOS = [
        // Português (legado): leem as tabelas especializadas da aula.
        'historia' => Legado\Historia::class,
        'conversa' => Legado\Conversa::class,
        'palavra' => Legado\Palavra::class,
        'palmas' => Legado\Palmas::class,
        'ficha' => Legado\Ficha::class,
        'montar_palavras' => Legado\MontarPalavras::class,
        'frase' => Legado\Frase::class,
        // Genéricos (config em JSON, avaliados no servidor; docs/atividades.md).
        'escolha' => Escolha::class,
        'verdadeiro_falso' => VerdadeiroFalso::class,
        'ordenar' => Ordenar::class,
        'linha_do_tempo' => Ordenar::class,
        'parear' => Parear::class,
        'contar' => Contar::class,
        'somar_subtrair' => SomarSubtrair::class,
        'escolher_silaba' => EscolherSilaba::class,
        'dinheiro' => Dinheiro::class,
        'mapa_pontos' => MapaPontos::class,
        'ditado' => Ditado::class,
    ];

    /** @var array<string, AvaliadorAtividade> */
    private static array $instancias = [];

    public static function para(string $tipo): AvaliadorAtividade
    {
        if (! isset(self::TIPOS[$tipo])) {
            throw new InvalidArgumentException("Tipo de atividade desconhecido: {$tipo}");
        }

        return self::$instancias[$tipo] ??= app(self::TIPOS[$tipo]);
    }

    public static function existe(string $tipo): bool
    {
        return isset(self::TIPOS[$tipo]);
    }

    public static function ehAvaliada(string $tipo): bool
    {
        return self::existe($tipo) && self::TIPOS[$tipo]::avaliada();
    }

    /** @return list<string> */
    public static function tipos(): array
    {
        return array_keys(self::TIPOS);
    }

    /** @return list<string> */
    public static function avaliados(): array
    {
        return array_values(array_filter(self::tipos(), fn (string $t) => self::ehAvaliada($t)));
    }
}
