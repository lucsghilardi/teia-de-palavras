<?php

namespace Database\Seeders;

use App\Models\OpcaoVisual;
use Illuminate\Database\Seeder;

/**
 * Avatares e figuras secretas. Emojis são placeholders: troque por ilustrações
 * enviando `imagem_path` (a tela mostra a imagem quando existir).
 */
class OpcoesVisuaisSeeder extends Seeder
{
    public const AVATARES = [
        ['raposa', 'Raposa', '🦊'], ['tigre', 'Tigre', '🐯'], ['panda', 'Panda', '🐼'],
        ['sapo', 'Sapo', '🐸'], ['leao', 'Leão', '🦁'], ['macaco', 'Macaco', '🐵'],
        ['coelho', 'Coelho', '🐰'], ['urso', 'Urso', '🐻'], ['polvo', 'Polvo', '🐙'],
        ['coruja', 'Coruja', '🦉'], ['tartaruga', 'Tartaruga', '🐢'], ['baleia', 'Baleia', '🐳'],
    ];

    /** 9 figuras para a grade 3×3 da entrada. */
    public const FIGURAS = [
        ['estrela', 'Estrela', '⭐'], ['lua', 'Lua', '🌙'], ['sol', 'Sol', '☀️'],
        ['arco-iris', 'Arco-íris', '🌈'], ['maca', 'Maçã', '🍎'], ['foguete', 'Foguete', '🚀'],
        ['balao', 'Balão', '🎈'], ['flor', 'Flor', '🌸'], ['bola', 'Bola', '⚽'],
    ];

    public function run(): void
    {
        foreach ([OpcaoVisual::TIPO_AVATAR => self::AVATARES, OpcaoVisual::TIPO_FIGURA => self::FIGURAS] as $tipo => $lista) {
            foreach ($lista as $ordem => [$chave, $rotulo, $emoji]) {
                OpcaoVisual::updateOrCreate(
                    ['chave' => $chave],
                    ['tipo' => $tipo, 'rotulo' => $rotulo, 'emoji' => $emoji, 'ordem' => $ordem + 1, 'ativa' => true],
                );
            }
        }
    }
}
