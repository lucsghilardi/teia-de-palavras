<?php

namespace App\Http\Requests\Crianca;

use Illuminate\Foundation\Http\FormRequest;

/** Query string: o texto a falar. Longo demais vira 422, que o app trata como "sem voz". */
class BuscarVozRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'texto' => ['required', 'string', 'max:'.(int) config('teia.voz.max_chars', 300)],
        ];
    }
}
