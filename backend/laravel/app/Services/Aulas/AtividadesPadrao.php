<?php

namespace App\Services\Aulas;

use App\Enums\Disciplina;
use App\Models\Aula;
use App\Models\AulaAtividade;

/**
 * Sequência de atividades que uma aula recebe ao nascer (ou quando o CMS não
 * manda `atividades`). Português mantém a sequência histórica das missões;
 * as outras disciplinas começam vazias e o educador monta no editor.
 */
final class AtividadesPadrao
{
    public const PORTUGUES = ['historia', 'conversa', 'palavra', 'palmas', 'ficha', 'montar_palavras', 'frase'];

    /** @return list<string> */
    public static function paraDisciplina(Disciplina $disciplina): array
    {
        return $disciplina === Disciplina::Portugues ? self::PORTUGUES : [];
    }

    /** Cria a sequência padrão se a aula ainda não tem atividade nenhuma. Idempotente. */
    public static function garantir(Aula $aula): void
    {
        if ($aula->atividades()->exists()) {
            return;
        }

        foreach (self::paraDisciplina($aula->disciplinaEnum()) as $posicao => $tipo) {
            AulaAtividade::create([
                'aula_id' => $aula->id,
                'ordem' => $posicao + 1,
                'tipo' => $tipo,
                'config' => [],
            ]);
        }
    }
}
