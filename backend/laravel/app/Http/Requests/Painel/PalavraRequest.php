<?php

namespace App\Http\Requests\Painel;

use Illuminate\Foundation\Http\FormRequest;

class PalavraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'palavra' => ['required', 'string', 'max:40', 'regex:/^\p{L}+$/u'],
            'silabas' => ['sometimes', 'array', 'max:10'],
            'silabas.*' => ['string', 'max:8'],
            'aprovada' => [$this->isMethod('post') ? 'sometimes' : 'required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return ['palavra.regex' => 'A palavra deve ter só letras, sem espaços.'];
    }
}
