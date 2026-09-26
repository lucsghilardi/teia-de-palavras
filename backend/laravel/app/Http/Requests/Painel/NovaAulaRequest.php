<?php

namespace App\Http\Requests\Painel;

use App\Enums\Disciplina;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class NovaAulaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('disciplina')) {
            $this->merge(['disciplina' => Disciplina::padrao()->value]);
        }
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'min:2', 'max:120'],
            'disciplina' => ['required', Rule::enum(Disciplina::class)],
            // Só Português tem palavra geradora; nas outras disciplinas o campo é ignorado.
            'palavra_geradora' => ['exclude_unless:disciplina,portugues', 'required', 'string', 'max:40', 'regex:/^\p{L}+$/u'],
            'fase' => ['required', 'integer', 'min:1', 'max:9'],
            'rotulo' => ['nullable', 'string', 'max:30'],
            'descricao' => ['nullable', 'string', 'max:200'],
            'habilidade_bncc' => ['nullable', 'string', 'max:40'],
        ];
    }

    public function messages(): array
    {
        return ['palavra_geradora.regex' => 'A palavra geradora deve ter só letras, sem espaços.'];
    }
}
