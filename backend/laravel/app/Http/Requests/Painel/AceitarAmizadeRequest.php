<?php

namespace App\Http\Requests\Painel;

use Illuminate\Foundation\Http\FormRequest;

class AceitarAmizadeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'turma_id' => ['required', 'integer', 'exists:turmas,id'],
            'codigo' => ['required', 'string', 'min:6', 'max:12'],
            'termo_aceito' => ['required', 'accepted'],
        ];
    }

    public function messages(): array
    {
        return ['termo_aceito.accepted' => 'É preciso aceitar o termo de amizade entre turmas.'];
    }
}
