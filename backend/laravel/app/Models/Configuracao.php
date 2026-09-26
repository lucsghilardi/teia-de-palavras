<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/** Chave/valor editável no painel (nome do herói, da fábrica, minutos de pausa...). */
class Configuracao extends Model
{
    protected $table = 'configuracoes';

    protected $primaryKey = 'chave';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $guarded = [];

    public const PADROES = [
        'heroi_nome' => 'Teco',
        'fabrica_nome' => 'Fábrica Faz-de-Conta',
        'minutos_pausa' => '20',
        'consentimento_versao' => 'v1',
        'consentimento_texto' => 'Declaro que sou responsável por esta criança e autorizo o uso do apelido, do avatar e dos áudios gravados dentro deste portal, apenas para fins educativos, podendo pedir a exclusão a qualquer momento.',
    ];

    public static function valor(string $chave, ?string $padrao = null): ?string
    {
        $todas = self::todas();

        return $todas[$chave] ?? $padrao ?? self::PADROES[$chave] ?? null;
    }

    /** @return array<string, string|null> */
    public static function todas(): array
    {
        return Cache::remember('configuracoes', 60, function () {
            return array_merge(self::PADROES, static::query()->pluck('valor', 'chave')->all());
        });
    }

    public static function definir(string $chave, ?string $valor): void
    {
        static::updateOrCreate(['chave' => $chave], ['valor' => $valor]);
        Cache::forget('configuracoes');
    }

    /** Substitui {{heroi}} e {{fabrica}} nos textos das histórias/perguntas. */
    public static function aplicarPlaceholders(string $texto): string
    {
        return strtr($texto, [
            '{{heroi}}' => (string) self::valor('heroi_nome'),
            '{{fabrica}}' => (string) self::valor('fabrica_nome'),
        ]);
    }
}
