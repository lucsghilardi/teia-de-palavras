<?php

namespace App\Http\Requests\Painel;

use Illuminate\Foundation\Http\FormRequest;

class ConfiguracoesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'heroi_nome' => ['required', 'string', 'max:60'],
            'fabrica_nome' => ['required', 'string', 'max:60'],
            'minutos_pausa' => ['required', 'integer', 'min:5', 'max:120'],
            'consentimento_versao' => ['required', 'string', 'max:20'],
            'consentimento_texto' => ['required', 'string', 'max:2000'],
        ];
    }
}
