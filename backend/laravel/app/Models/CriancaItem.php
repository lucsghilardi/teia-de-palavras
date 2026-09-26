<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Um item da revisão espaçada da criança (caixa de Leitner + próxima data). */
class CriancaItem extends Model
{
    protected $table = 'crianca_itens';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'dados' => 'array',
            'caixa' => 'integer',
            'acertos' => 'integer',
            'erros' => 'integer',
            'ultimo_resultado' => 'boolean',
            'proxima_revisao_em' => 'date',
            'revisado_em' => 'datetime',
        ];
    }

    public function crianca(): BelongsTo
    {
        return $this->belongsTo(Crianca::class, 'crianca_id');
    }

    /** Itens cuja revisão já venceu (hoje ou antes). */
    public function scopeDevidos(Builder $query): Builder
    {
        return $query->whereDate('proxima_revisao_em', '<=', today());
    }

    public function scopeDominados(Builder $query): Builder
    {
        return $query->where('caixa', '>=', (int) config('teia.revisao.caixa_dominada', 4));
    }

    public function tipo(): string
    {
        return (string) ($this->dados['tipo'] ?? 'escolha');
    }

    /** @return array<string, mixed> */
    public function configArray(): array
    {
        $config = $this->dados['config'] ?? [];

        return is_array($config) ? $config : [];
    }
}
