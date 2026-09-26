<?php

namespace App\Http\Resources;

use App\Support\Midia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Uma atividade da aula, como o editor do CMS a vê. @mixin \App\Models\AulaAtividade */
class AulaAtividadeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ordem' => $this->ordem,
            'tipo' => $this->tipo,
            'titulo' => $this->titulo,
            'instrucao' => $this->instrucao,
            'config' => (object) $this->configArray(),
            'imagem_url' => Midia::url($this->imagem_path),
            'avaliada' => $this->ehAvaliada(),
        ];
    }
}
