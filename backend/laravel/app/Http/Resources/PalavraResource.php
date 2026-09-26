<?php

namespace App\Http\Resources;

use App\Models\Palavra;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Palavra */
class PalavraResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'palavra' => $this->palavra,
            'palavra_normalizada' => $this->palavra_normalizada,
            'silabas' => $this->silabas,
            'origem' => $this->origem,
            'aprovada' => (bool) $this->aprovada,
            'aprovada_em' => $this->aprovada_em,
            'created_at' => $this->created_at,
        ];
    }
}
