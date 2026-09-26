<?php

namespace App\Http\Requests\Painel;

use Illuminate\Foundation\Http\FormRequest;

class TurmaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['nome' => trim((string) $this->input('nome'))]);
    }

    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'min:2', 'max:80'],
            'ativa' => [$this->isMethod('post') ? 'sometimes' : 'required', 'boolean'],
        ];
    }
}
