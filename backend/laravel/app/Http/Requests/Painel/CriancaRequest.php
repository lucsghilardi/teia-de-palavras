<?php

namespace App\Http\Requests\Painel;

use App\Models\OpcaoVisual;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Cadastro/edição de criança. LGPD: só apelido, avatar, figura secreta e
 * turma. Qualquer outro campo é ignorado. No cadastro o consentimento do
 * responsável é obrigatório.
 */
class CriancaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['apelido' => trim(preg_replace('/\s+/u', ' ', (string) $this->input('apelido')) ?? '')]);
    }

    public function rules(): array
    {
        $criando = $this->isMethod('post');
        $criancaId = $this->route('crianca')?->id;

        return [
            'turma_id' => ['required', 'integer', 'exists:turmas,id'],
            'apelido' => [
                'required', 'string', 'min:2', 'max:40',
                Rule::unique('criancas', 'apelido')
                    ->where('turma_id', $this->input('turma_id'))
                    ->whereNull('deleted_at')
                    ->ignore($criancaId),
            ],
            'avatar_chave' => ['required', 'string', Rule::exists('opcoes_visuais', 'chave')->where('tipo', OpcaoVisual::TIPO_AVATAR)->where('ativa', true)],
            'usa_minusculas' => ['sometimes', 'boolean'],
            'figura_secreta_chave' => $criando
                ? ['required', 'string', Rule::exists('opcoes_visuais', 'chave')->where('tipo', OpcaoVisual::TIPO_FIGURA)->where('ativa', true)]
                : ['prohibited'],
            'consentimento' => $criando ? ['required', 'array'] : ['prohibited'],
            'consentimento.aceito' => $criando ? ['accepted'] : [],
            'consentimento.versao_texto' => $criando ? ['required', 'string', 'max:20'] : [],
        ];
    }

    public function messages(): array
    {
        return [
            'apelido.unique' => 'Já existe uma criança com esse apelido nesta turma.',
            'consentimento.required' => 'O consentimento do responsável é obrigatório.',
            'consentimento.aceito.accepted' => 'O consentimento do responsável é obrigatório.',
            'figura_secreta_chave.prohibited' => 'Use a ação "Redefinir figura secreta".',
        ];
    }
}
