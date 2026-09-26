<?php

namespace App\Http\Requests\Roda;

use Illuminate\Foundation\Http\FormRequest;

class AbrirRodaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'turma_id' => ['required', 'integer', 'exists:turmas,id'],
            'aula_id' => ['required', 'integer', 'exists:aulas,id'],
        ];
    }
}
