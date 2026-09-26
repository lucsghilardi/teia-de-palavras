<?php

namespace App\Http\Requests\Painel;

use Illuminate\Foundation\Http\FormRequest;

/** Documento completo da aula (ver docs/api-painel.md). */
class AtualizarAulaRequest extends FormRequest
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
            'pre_requisito_aula_id' => ['nullable', 'integer', 'exists:aulas,id'],

            'silabas' => ['present', 'array', 'max:12'],
            'silabas.*.texto' => ['required', 'string', 'max:8', 'regex:/^\p{L}+$/u'],
            'silabas.*.familia' => ['present', 'array', 'max:12'],
            'silabas.*.familia.*' => ['required', 'string', 'max:8', 'regex:/^\p{L}+$/u'],

            'historia_paginas' => ['present', 'array', 'max:20'],
            'historia_paginas.*.id' => ['nullable', 'integer'],
            'historia_paginas.*.texto' => ['required', 'string', 'max:600'],

            'perguntas' => ['present', 'array', 'max:10'],
            'perguntas.*.id' => ['nullable', 'integer'],
            'perguntas.*.texto' => ['required', 'string', 'max:300'],

            'palavras' => ['present', 'array', 'max:60'],
            'palavras.*.id' => ['nullable', 'integer'],
            'palavras.*.palavra' => ['required', 'string', 'max:40', 'regex:/^\p{L}+$/u'],
            'palavras.*.silabas' => ['sometimes', 'array', 'max:10'],
            'palavras.*.silabas.*' => ['string', 'max:8'],
            'palavras.*.destaque' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'palavra_geradora.regex' => 'A palavra geradora deve ter só letras, sem espaços.',
            'palavras.*.palavra.regex' => 'Cada palavra deve ter só letras, sem espaços.',
            'silabas.*.texto.regex' => 'Sílabas devem ter só letras.',
            'silabas.*.familia.*.regex' => 'Membros da família devem ter só letras.',
        ];
    }
}
