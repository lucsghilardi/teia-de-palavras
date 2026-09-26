<?php

namespace App\Services\MiniAulas;

use App\Enums\Disciplina;
use App\Models\Aula;
use App\Models\AulaAtividade;
use App\Models\Crianca;
use App\Services\Atividades\SomarSubtrair;
use App\Services\Atividades\Suporte\Embaralhador;
use App\Services\Palavras\Silabador;

/**
 * Modelos de mini-aula: desafios de UM item gerados a partir de uma missão
 * que a criança já jogou. A criança escolhe um modelo e grava a voz; ela
 * nunca digita (programas estruturados de "aprender ensinando" rendem mais).
 * `semente` troca o sorteio ("outro").
 */
class ModelosMiniAula
{
    public const MAXIMO = 3;

    /**
     * @return list<array{chave: string, tipo: string, titulo: string, fala: string, config: array<string, mixed>}>
     */
    public function para(Crianca $crianca, Aula $aula, int $semente = 0): array
    {
        $modelos = match ($aula->disciplinaEnum()) {
            Disciplina::Portugues => $this->portugues($aula, $semente),
            Disciplina::Matematica => $this->matematica($aula, $semente),
            default => $this->generico($aula, $semente),
        };

        return array_slice(array_values($modelos), 0, self::MAXIMO);
    }

    /** O modelo com esta chave, regenerado no servidor (a criança só manda a chave). */
    public function resolver(Crianca $crianca, Aula $aula, string $chave, int $semente = 0): ?array
    {
        foreach ($this->para($crianca, $aula, $semente) as $modelo) {
            if ($modelo['chave'] === $chave) {
                return $modelo;
            }
        }

        return null;
    }

    /** @return list<array<string, mixed>> */
    private function portugues(Aula $aula, int $semente): array
    {
        $palavras = $aula->palavras()->orderBy('destaque', 'desc')->orderBy('id')->pluck('palavra')
            ->map(fn ($p) => mb_strtoupper($p, 'UTF-8'))
            ->filter(fn ($p) => count(Silabador::separar($p)) >= 2)
            ->values()
            ->all();

        if ($palavras === []) {
            return [];
        }

        $palavras = Embaralhador::embaralhar($palavras, $semente + 11);
        $todasSilabas = collect($palavras)->flatMap(fn ($p) => Silabador::separar($p))->unique()->values()->all();
        $modelos = [];

        foreach (array_slice($palavras, 0, 3) as $i => $palavra) {
            $silabas = Silabador::separar($palavra);
            $distratores = array_values(array_filter($todasSilabas, fn ($s) => ! in_array($s, $silabas, true)));
            $distratores = array_slice(Embaralhador::embaralhar($distratores, $semente + $i), 0, 2);

            if ($i % 2 === 0) {
                $oculta = count($silabas) - 1;
                $modelos[] = [
                    'chave' => 'silaba:'.$palavra,
                    'tipo' => 'escolher_silaba',
                    'titulo' => 'Qual sílaba falta em '.mb_strtolower($palavra, 'UTF-8').'?',
                    'fala' => 'Qual sílaba falta na palavra '.mb_strtolower($palavra, 'UTF-8').'? Toque na peça certa.',
                    'config' => ['itens' => [['modo' => 'completar', 'palavra' => $palavra, 'silabas' => $silabas, 'oculta' => $oculta, 'opcoes' => [...$distratores, $silabas[$oculta]]]]],
                ];
            } else {
                $modelos[] = [
                    'chave' => 'ditado:'.$palavra,
                    'tipo' => 'ditado',
                    'titulo' => 'Ditado: '.mb_strtolower($palavra, 'UTF-8'),
                    'fala' => 'Ouça bem e monte a palavra '.mb_strtolower($palavra, 'UTF-8').' com as peças.',
                    'config' => ['itens' => [['palavra' => $palavra, 'silabas' => $silabas, 'opcoes' => $distratores]]],
                ];
            }
        }

        return $modelos;
    }

    /** @return list<array<string, mixed>> */
    private function matematica(Aula $aula, int $semente): array
    {
        $modelos = [];

        foreach ($aula->atividades as $atividade) {
            $config = $atividade->configArray();

            if ($atividade->tipo === 'somar_subtrair' && count($modelos) < 2) {
                $itens = $config['itens'] ?? [];
                $fato = $itens !== [] ? Embaralhador::embaralhar(array_values($itens), $semente)[0] : (SomarSubtrair::gerar($config['gerar'] ?? ['quantidade' => 1, 'maximo' => 20, 'operacoes' => ['+']], $semente + 3)[0] ?? null);

                if ($fato !== null) {
                    $id = SomarSubtrair::idDoFato($fato);
                    $fala = $fato['operacao'] === '+' ? "{$fato['a']} mais {$fato['b']}" : "{$fato['a']} menos {$fato['b']}";
                    $modelos['fato:'.$id] = [
                        'chave' => 'fato:'.$id,
                        'tipo' => 'somar_subtrair',
                        'titulo' => "Quanto é {$id}?",
                        'fala' => "Quanto é {$fala}? Toque no número certo.",
                        'config' => ['itens' => [$fato], 'apoio' => $config['apoio'] ?? 'icones', 'opcoes' => 3],
                    ];
                }
            }

            if ($atividade->tipo === 'contar' && ! isset($modelos['contar'])) {
                $item = Embaralhador::embaralhar(array_values($config['itens'] ?? []), $semente + 5)[0] ?? null;

                if ($item !== null) {
                    $modelos['contar'] = [
                        'chave' => 'contar:'.$item['quantidade'],
                        'tipo' => 'contar',
                        'titulo' => 'Quantos são?',
                        'fala' => 'Conte de 10 em 10 e toque no número certo.',
                        'config' => ['itens' => [['icone' => $item['icone'], 'quantidade' => (int) $item['quantidade']]]],
                    ];
                }
            }
        }

        if ($modelos === []) {
            $fato = SomarSubtrair::gerar(['quantidade' => 1, 'maximo' => 20, 'operacoes' => ['+']], $semente + 7)[0];
            $id = SomarSubtrair::idDoFato($fato);
            $modelos[] = ['chave' => 'fato:'.$id, 'tipo' => 'somar_subtrair', 'titulo' => "Quanto é {$id}?", 'fala' => "Quanto é {$fato['a']} mais {$fato['b']}?", 'config' => ['itens' => [$fato], 'apoio' => 'icones', 'opcoes' => 3]];
        }

        return array_values($modelos);
    }

    /** Geografia/História: um item de escolha, verdadeiro/falso, ordenar ou parear da missão. */
    private function generico(Aula $aula, int $semente): array
    {
        $modelos = [];

        foreach ($aula->atividades as $atividade) {
            $config = $atividade->configArray();

            if (in_array($atividade->tipo, ['escolha', 'verdadeiro_falso'], true) && count($modelos) < 3) {
                $item = Embaralhador::embaralhar(array_values($config['itens'] ?? []), $semente + (int) $atividade->ordem)[0] ?? null;

                if ($item !== null) {
                    $texto = (string) ($item['pergunta'] ?? $item['frase'] ?? '');
                    $modelos[] = [
                        'chave' => $atividade->tipo.':'.$atividade->ordem.':'.($item['id'] ?? '1'),
                        'tipo' => $atividade->tipo,
                        'titulo' => $texto,
                        'fala' => $atividade->tipo === 'verdadeiro_falso' ? "Verdadeiro ou falso: {$texto}" : "{$texto} Toque na resposta.",
                        'config' => ['itens' => [$item], 'embaralhar' => true],
                    ];
                }
            } elseif (in_array($atividade->tipo, ['ordenar', 'linha_do_tempo'], true) && count($modelos) < 3) {
                $modelos[] = [
                    'chave' => $atividade->tipo.':'.$atividade->ordem,
                    'tipo' => $atividade->tipo,
                    'titulo' => 'Coloque em ordem: '.($config['instrucao'] ?? $atividade->titulo ?? 'os itens'),
                    'fala' => 'Coloque em ordem: '.($config['instrucao'] ?? 'do primeiro ao último').'.',
                    'config' => $config,
                ];
            } elseif ($atividade->tipo === 'parear' && count($modelos) < 3) {
                $pares = array_slice(Embaralhador::embaralhar(array_values($config['pares'] ?? []), $semente + 9), 0, 2);

                if (count($pares) >= 2) {
                    $modelos[] = [
                        'chave' => 'parear:'.$atividade->ordem,
                        'tipo' => 'parear',
                        'titulo' => 'Ligue os pares: '.($config['instrucao'] ?? $atividade->titulo ?? ''),
                        'fala' => 'Ligue cada item ao seu par.',
                        'config' => ['instrucao' => $config['instrucao'] ?? null, 'pares' => $pares, 'dica' => $config['dica'] ?? null],
                    ];
                }
            }
        }

        return $modelos;
    }

    /** Atividade virtual (sem aula) para montar/avaliar uma mini-aula. */
    public static function atividadeVirtual(string $tipo, array $config, int $ordem = 1): AulaAtividade
    {
        return new AulaAtividade(['aula_id' => 0, 'ordem' => $ordem, 'tipo' => $tipo, 'config' => $config]);
    }
}
