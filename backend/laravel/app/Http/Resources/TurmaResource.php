<?php

namespace App\Http\Resources;

use App\Models\Turma;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Turma */
class TurmaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'codigo' => $this->codigo,
            'ativa' => (bool) $this->ativa,
            'educador' => $this->whenLoaded('educador', fn () => ['id' => $this->educador->id, 'name' => $this->educador->name]),
            'total_criancas' => (int) ($this->criancas_count ?? $this->criancas()->count()),
            'criancas' => CriancaResumoResource::collection($this->whenLoaded('criancas')),
            'created_at' => $this->created_at,
        ];
    }
}
