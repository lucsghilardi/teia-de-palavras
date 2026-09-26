<?php

namespace App\Http\Requests\Painel;

use Illuminate\Foundation\Http\FormRequest;

class NovaAulaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'min:2', 'max:120'],
            'palavra_geradora' => ['required', 'string', 'max:40', 'regex:/^\p{L}+$/u'],
            'fase' => ['required', 'integer', 'min:1', 'max:9'],
        ];
    }

    public function messages(): array
    {
        return ['palavra_geradora.regex' => 'A palavra geradora deve ter só letras, sem espaços.'];
    }
}
