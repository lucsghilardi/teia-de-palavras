<?php

namespace App\Http\Resources;

use App\Support\Midia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Documento completo da aula para o editor do CMS. @mixin \App\Models\Aula */
class AulaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'titulo' => $this->titulo,
            'fase' => $this->fase,
            'ordem' => $this->ordem,
            'status' => $this->status,
            'palavra_geradora' => $this->palavra_geradora,
            'palavra_imagem_url' => Midia::url($this->palavra_imagem_path),
            'palavra_audio_url' => Midia::url($this->palavra_audio_path),
            'pre_requisito_aula_id' => $this->pre_requisito_aula_id,
            'criada_por' => $this->criadaPor ? ['id' => $this->criadaPor->id, 'name' => $this->criadaPor->name] : null,
            'silabas' => $this->silabas->map(fn ($s) => [
                'id' => $s->id,
                'texto' => $s->silaba->texto,
                'ordem' => $s->ordem,
                'audio_url' => Midia::url($s->silaba->audio_path),
                'familia' => $s->familia->map(fn ($f) => [
                    'id' => $f->silaba->id,
                    'texto' => $f->silaba->texto,
                    'audio_url' => Midia::url($f->silaba->audio_path),
                ])->values(),
            ])->values(),
            'historia_paginas' => $this->historiaPaginas->map(fn ($p) => [
                'id' => $p->id,
                'ordem' => $p->ordem,
                'texto' => $p->texto,
                'imagem_url' => Midia::url($p->imagem_path),
                'audio_url' => Midia::url($p->audio_path),
            ])->values(),
            'perguntas' => $this->perguntas->map(fn ($q) => [
                'id' => $q->id,
                'ordem' => $q->ordem,
                'texto' => $q->texto,
                'audio_url' => Midia::url($q->audio_path),
            ])->values(),
            'palavras' => $this->palavras->map(fn ($w) => [
                'id' => $w->id,
                'palavra' => $w->palavra,
                'silabas' => $w->silabas,
                'destaque' => (bool) $w->destaque,
                'imagem_url' => Midia::url($w->imagem_path),
                'audio_url' => Midia::url($w->audio_path),
            ])->values(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
