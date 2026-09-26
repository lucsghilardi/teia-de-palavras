<?php

namespace App\Http\Requests\Crianca;

use Illuminate\Foundation\Http\FormRequest;

/** Multipart: a missão de origem, a chave do modelo (regenerado no servidor), a semente e o áudio. */
class CriarMiniAulaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $mimes = implode(',', (array) config('teia.mini_aulas.mimes', ['webm', 'mp4', 'm4a', 'ogg', 'mp3', 'wav']));
        $kb = (int) config('teia.mini_aulas.tamanho_max_kb', 2048);

        return [
            'aula_id' => ['required', 'integer', 'exists:aulas,id'],
            'modelo' => ['required', 'string', 'max:60'],
            'semente' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'duracao_ms' => ['nullable', 'integer', 'min:1', 'max:600000'],
            'audio' => ['required', 'file', "mimes:{$mimes}", "max:{$kb}"],
        ];
    }
}
