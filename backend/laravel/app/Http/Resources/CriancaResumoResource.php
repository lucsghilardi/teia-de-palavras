<?php

namespace App\Http\Resources;

use App\Models\Crianca;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Crianca */
class CriancaResumoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'apelido' => $this->apelido,
            'avatar' => $this->avatar ? new OpcaoVisualResource($this->avatar) : null,
            'usa_minusculas' => (bool) $this->usa_minusculas,
            'narracao_automatica' => (bool) $this->narracao_automatica,
        ];
    }
}
