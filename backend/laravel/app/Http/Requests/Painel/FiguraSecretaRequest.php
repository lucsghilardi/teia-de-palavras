<?php

namespace App\Http\Requests\Painel;

use App\Models\OpcaoVisual;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FiguraSecretaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'figura_secreta_chave' => ['required', 'string', Rule::exists('opcoes_visuais', 'chave')->where('tipo', OpcaoVisual::TIPO_FIGURA)->where('ativa', true)],
        ];
    }
}
