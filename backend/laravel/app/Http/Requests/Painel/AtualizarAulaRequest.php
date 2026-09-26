<?php

namespace App\Http\Requests\Painel;

use App\Models\Aula;
use App\Services\Atividades\RegistroAtividades;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Documento completo da aula (ver docs/api-painel.md). A disciplina vem da
 * própria aula (não muda pelo PUT): em Português o material da palavra
 * geradora é obrigatório; nas outras disciplinas ele é ignorado e o documento
 * pode trazer só `atividades`.
 */
class AtualizarAulaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $aula = $this->route('aula');

        $this->merge(['disciplina' => $aula instanceof Aula ? $aula->disciplina : 'portugues']);
    }

    public function rules(): array
    {
        $soPortugues = 'exclude_unless:disciplina,portugues';

        return [
            'titulo' => ['required', 'string', 'min:2', 'max:120'],
            'palavra_geradora' => [$soPortugues, 'required', 'string', 'max:40', 'regex:/^\p{L}+$/u'],
            'fase' => ['required', 'integer', 'min:1', 'max:9'],
            'pre_requisito_aula_id' => ['nullable', 'integer', 'exists:aulas,id'],
            'rotulo' => ['sometimes', 'nullable', 'string', 'max:30'],
            'descricao' => ['sometimes', 'nullable', 'string', 'max:200'],
            'habilidade_bncc' => ['sometimes', 'nullable', 'string', 'max:40'],

            'silabas' => [$soPortugues, 'present', 'array', 'max:12'],
            'silabas.*.texto' => ['required', 'string', 'max:8', 'regex:/^\p{L}+$/u'],
            'silabas.*.familia' => ['present', 'array', 'max:12'],
            'silabas.*.familia.*' => ['required', 'string', 'max:8', 'regex:/^\p{L}+$/u'],

            'historia_paginas' => [$soPortugues, 'present', 'array', 'max:20'],
            'historia_paginas.*.id' => ['nullable', 'integer'],
            'historia_paginas.*.texto' => ['required', 'string', 'max:600'],

            'perguntas' => [$soPortugues, 'present', 'array', 'max:10'],
            'perguntas.*.id' => ['nullable', 'integer'],
            'perguntas.*.texto' => ['required', 'string', 'max:300'],

            'palavras' => [$soPortugues, 'present', 'array', 'max:60'],
            'palavras.*.id' => ['nullable', 'integer'],
            'palavras.*.palavra' => ['required', 'string', 'max:40', 'regex:/^\p{L}+$/u'],
            'palavras.*.silabas' => ['sometimes', 'array', 'max:10'],
            'palavras.*.silabas.*' => ['string', 'max:8'],
            'palavras.*.destaque' => ['sometimes', 'boolean'],

            'atividades' => ['sometimes', 'array', 'max:20'],
            'atividades.*.id' => ['nullable', 'integer'],
            'atividades.*.tipo' => ['required', 'string', Rule::in(RegistroAtividades::tipos())],
            'atividades.*.titulo' => ['nullable', 'string', 'max:80'],
            'atividades.*.instrucao' => ['nullable', 'string', 'max:200'],
            'atividades.*.config' => ['sometimes', 'nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'palavra_geradora.regex' => 'A palavra geradora deve ter só letras, sem espaços.',
            'palavras.*.palavra.regex' => 'Cada palavra deve ter só letras, sem espaços.',
            'silabas.*.texto.regex' => 'Sílabas devem ter só letras.',
            'silabas.*.familia.*.regex' => 'Membros da família devem ter só letras.',
            'atividades.*.tipo.in' => 'Tipo de atividade desconhecido.',
        ];
    }
}
