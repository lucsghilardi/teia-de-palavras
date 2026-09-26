<?php

namespace App\Services\Aulas;

use App\Models\Aula;
use App\Models\AulaAtividade;
use App\Models\AulaHistoriaPagina;
use App\Models\AulaPalavra;
use App\Models\AulaPergunta;
use App\Support\Midia;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

/** Upload e remoção de imagem/áudio das aulas (disco público). */
class AulaMidiaService
{
    /** alvo => [modelo (null = a própria aula), coluna, tipo de arquivo] */
    public const ALVOS = [
        'palavra_imagem' => [null, 'palavra_imagem_path', 'imagem'],
        'palavra_audio' => [null, 'palavra_audio_path', 'audio'],
        'pagina_imagem' => [AulaHistoriaPagina::class, 'imagem_path', 'imagem'],
        'pagina_audio' => [AulaHistoriaPagina::class, 'audio_path', 'audio'],
        'pergunta_audio' => [AulaPergunta::class, 'audio_path', 'audio'],
        'palavra_dicionario_imagem' => [AulaPalavra::class, 'imagem_path', 'imagem'],
        'palavra_dicionario_audio' => [AulaPalavra::class, 'audio_path', 'audio'],
        'atividade_imagem' => [AulaAtividade::class, 'imagem_path', 'imagem'],
    ];

    public function salvar(Aula $aula, string $alvo, ?int $alvoId, UploadedFile $arquivo): string
    {
        [$registro, $coluna] = $this->resolver($aula, $alvo, $alvoId);

        $path = $arquivo->store("aulas/{$aula->id}", Midia::DISCO);

        if ($path === false) {
            throw ValidationException::withMessages(['arquivo' => 'Não foi possível salvar o arquivo.']);
        }

        $antigo = $registro->{$coluna};
        $registro->update([$coluna => $path]);
        Midia::apagar($antigo);

        return (string) Midia::url($path);
    }

    public function remover(Aula $aula, string $alvo, ?int $alvoId): void
    {
        [$registro, $coluna] = $this->resolver($aula, $alvo, $alvoId);

        Midia::apagar($registro->{$coluna});
        $registro->update([$coluna => null]);
    }

    public static function tipoDoAlvo(string $alvo): ?string
    {
        return self::ALVOS[$alvo][2] ?? null;
    }

    /** @return array{0: Model, 1: string} */
    private function resolver(Aula $aula, string $alvo, ?int $alvoId): array
    {
        [$modelo, $coluna] = self::ALVOS[$alvo];

        if ($modelo === null) {
            return [$aula, $coluna];
        }

        $registro = $alvoId === null ? null : $modelo::query()->where('aula_id', $aula->id)->find($alvoId);

        if ($registro === null) {
            throw ValidationException::withMessages(['alvo_id' => 'Item não encontrado nesta aula. Salve a aula antes de enviar mídia.']);
        }

        return [$registro, $coluna];
    }
}
