<?php

namespace App\Http\Requests\Crianca;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Resposta da criança a uma atividade. O corpo depende do tipo (ver
 * docs/atividades.md); aqui só se garante o formato geral e o `item`.
 */
class ResponderAtividadeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'item' => ['sometimes', 'nullable', 'string', 'max:40'],
            'silabas' => ['sometimes', 'array', 'max:6'],
            'silabas.*' => ['string', 'max:8'],
            'palavras' => ['sometimes', 'array', 'max:12'],
            'palavras.*' => ['string', 'max:40'],
            'opcao' => ['sometimes', 'nullable', 'string', 'max:40'],
            'valor' => ['sometimes', 'nullable', 'integer'],
            'silaba' => ['sometimes', 'nullable', 'string', 'max:8'],
            'b' => ['sometimes', 'nullable', 'string', 'max:40'],
            'ordem' => ['sometimes', 'array', 'max:8'],
            'ordem.*' => ['string', 'max:40'],
        ];
    }

    /** @return array<string, mixed> */
    public function resposta(): array
    {
        return $this->all();
    }
}
