<?php

namespace App\Models;

use App\Services\Atividades\AvaliadorAtividade;
use App\Services\Atividades\RegistroAtividades;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Uma atividade da missão, na ordem. `tipo` escolhe o avaliador (ver
 * RegistroAtividades) e `config` guarda o conteúdo em JSON validado por ele.
 * Os tipos legados de Português usam config vazio e leem as tabelas
 * especializadas da aula.
 */
class AulaAtividade extends Model
{
    protected $table = 'aula_atividades';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'ordem' => 'integer',
        ];
    }

    public function aula(): BelongsTo
    {
        return $this->belongsTo(Aula::class, 'aula_id');
    }

    public function avaliador(): AvaliadorAtividade
    {
        return RegistroAtividades::para($this->tipo);
    }

    /** Pede resposta da criança (e conta para XP)? */
    public function ehAvaliada(): bool
    {
        return RegistroAtividades::ehAvaliada($this->tipo);
    }

    /** @return array<string, mixed> */
    public function configArray(): array
    {
        return is_array($this->config) ? $this->config : [];
    }
}
