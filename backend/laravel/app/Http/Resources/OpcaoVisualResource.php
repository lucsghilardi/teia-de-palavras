<?php

namespace App\Http\Resources;

use App\Models\OpcaoVisual;
use App\Support\Midia;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin OpcaoVisual */
class OpcaoVisualResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'chave' => $this->chave,
            'rotulo' => $this->rotulo,
            'emoji' => $this->emoji,
            'icone' => $this->icone,
            'cor' => $this->cor,
            'imagem_url' => Midia::url($this->imagem_path),
        ];
    }
}
