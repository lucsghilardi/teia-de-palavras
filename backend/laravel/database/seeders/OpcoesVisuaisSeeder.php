<?php

namespace Database\Seeders;

use App\Models\OpcaoVisual;
use Illuminate\Database\Seeder;

/**
 * Avatares e figuras secretas. A tela desenha o `icone` (lucide) na `cor`;
 * o emoji fica só como reserva textual (painel, exportações). Uma ilustração
 * enviada em `imagem_path` vale mais que os dois.
 */
class OpcoesVisuaisSeeder extends Seeder
{
    /** Tripulação da nave Teia: [chave, rótulo, emoji, ícone, cor]. */
    public const AVATARES = [
        ['nave', 'Nave', '🚀', 'rocket', '#22d3ee'],
        ['robo', 'Robô', '🤖', 'bot', '#a3e635'],
        ['satelite', 'Satélite', '🛰️', 'satellite', '#60a5fa'],
        ['cometa', 'Cometa', '☄️', 'sparkles', '#f472b6'],
        ['supernova', 'Supernova', '🌟', 'star', '#facc15'],
        ['luna', 'Luna', '🌙', 'moon', '#c4b5fd'],
        ['planeta', 'Planeta', '🪐', 'earth', '#34d399'],
        ['radar', 'Radar', '📡', 'radar', '#fb923c'],
        ['atomo', 'Átomo', '⚛️', 'atom', '#e879f9'],
        ['telescopio', 'Telescópio', '🔭', 'telescope', '#38bdf8'],
        ['orbita', 'Órbita', '🪐', 'orbit', '#fbbf24'],
        ['raio', 'Raio', '⚡', 'zap', '#f87171'],
    ];

    /** Bichinhos da primeira versão: seguem existindo (crianças antigas), mas não são oferecidos. */
    public const AVATARES_ANTIGOS = [
        ['raposa', 'Raposa', '🦊', 'squirrel', '#fb923c'], ['tigre', 'Tigre', '🐯', 'cat', '#f59e0b'], ['panda', 'Panda', '🐼', 'smile', '#e5e7eb'],
        ['sapo', 'Sapo', '🐸', 'bug', '#84cc16'], ['leao', 'Leão', '🦁', 'sun', '#f59e0b'], ['macaco', 'Macaco', '🐵', 'smile', '#a16207'],
        ['coelho', 'Coelho', '🐰', 'rabbit', '#f9a8d4'], ['urso', 'Urso', '🐻', 'dog', '#a16207'], ['polvo', 'Polvo', '🐙', 'shell', '#c084fc'],
        ['coruja', 'Coruja', '🦉', 'bird', '#a78bfa'], ['tartaruga', 'Tartaruga', '🐢', 'turtle', '#34d399'], ['baleia', 'Baleia', '🐳', 'fish', '#60a5fa'],
    ];

    /** 9 figuras para a grade 3×3 da entrada (chaves e rótulos estáveis). */
    public const FIGURAS = [
        ['estrela', 'Estrela', '⭐', 'star', '#facc15'], ['lua', 'Lua', '🌙', 'moon', '#c4b5fd'], ['sol', 'Sol', '☀️', 'sun', '#fb923c'],
        ['arco-iris', 'Arco-íris', '🌈', 'rainbow', '#f472b6'], ['maca', 'Maçã', '🍎', 'apple', '#f87171'], ['foguete', 'Foguete', '🚀', 'rocket', '#22d3ee'],
        ['balao', 'Balão', '🎈', 'balloon', '#e879f9'], ['flor', 'Flor', '🌸', 'flower', '#a3e635'], ['bola', 'Bola', '⚽', 'volleyball', '#60a5fa'],
    ];

    public function run(): void
    {
        $listas = [
            [OpcaoVisual::TIPO_AVATAR, self::AVATARES, true],
            [OpcaoVisual::TIPO_AVATAR, self::AVATARES_ANTIGOS, false],
            [OpcaoVisual::TIPO_FIGURA, self::FIGURAS, true],
        ];

        foreach ($listas as [$tipo, $lista, $ativa]) {
            foreach ($lista as $ordem => [$chave, $rotulo, $emoji, $icone, $cor]) {
                OpcaoVisual::updateOrCreate(
                    ['chave' => $chave],
                    ['tipo' => $tipo, 'rotulo' => $rotulo, 'emoji' => $emoji, 'icone' => $icone, 'cor' => $cor, 'ordem' => $ordem + 1, 'ativa' => $ativa],
                );
            }
        }
    }
}
