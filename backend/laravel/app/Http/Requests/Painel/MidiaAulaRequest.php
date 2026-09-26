<?php

namespace App\Http\Requests\Painel;

use App\Services\Aulas\AulaMidiaService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MidiaAulaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tipo = AulaMidiaService::tipoDoAlvo((string) $this->input('alvo'));
        $precisaId = str_starts_with((string) $this->input('alvo'), 'pagina_')
            || str_starts_with((string) $this->input('alvo'), 'pergunta_')
            || str_starts_with((string) $this->input('alvo'), 'palavra_dicionario_');

        $regras = [
            'alvo' => ['required', 'string', Rule::in(array_keys(AulaMidiaService::ALVOS))],
            'alvo_id' => [$precisaId ? 'required' : 'nullable', 'integer'],
        ];

        if ($this->isMethod('post')) {
            // SVG fica de fora: seria servido pelo domínio da API e pode carregar script.
            $regras['arquivo'] = match ($tipo) {
                'imagem' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
                'audio' => ['required', 'file', 'mimes:mp3,m4a,mp4,ogg,oga,webm,wav', 'max:10240'],
                default => ['required', 'file'],
            };
        }

        return $regras;
    }
}
