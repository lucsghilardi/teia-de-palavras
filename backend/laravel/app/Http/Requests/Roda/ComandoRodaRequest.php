<?php

namespace App\Http\Requests\Roda;

use App\Services\Roda\RodaService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ComandoRodaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'acao' => ['required', Rule::in(RodaService::ACOES)],
            'valor' => ['nullable', 'integer', 'min:0', 'max:100'],
        ];
    }
}
