<?php

namespace App\Http\Resources;

use App\Models\Aula;
use App\Support\Midia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Aula */
class AulaResumoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'disciplina' => $this->disciplina,
            'titulo' => $this->titulo,
            'rotulo' => $this->rotuloExibido(),
            'descricao' => $this->descricao,
            'habilidade_bncc' => $this->habilidade_bncc,
            'fase' => $this->fase,
            'ordem' => $this->ordem,
            'palavra_geradora' => $this->palavra_geradora,
            'status' => $this->status,
            'pre_requisito_aula_id' => $this->pre_requisito_aula_id,
            'palavra_imagem_url' => Midia::url($this->palavra_imagem_path),
            'totais' => [
                'silabas' => (int) ($this->silabas_count ?? 0),
                'palavras' => (int) ($this->palavras_count ?? 0),
                'paginas' => (int) ($this->historia_paginas_count ?? 0),
                'perguntas' => (int) ($this->perguntas_count ?? 0),
                'atividades' => (int) ($this->atividades_count ?? 0),
            ],
            'updated_at' => $this->updated_at,
        ];
    }
}
