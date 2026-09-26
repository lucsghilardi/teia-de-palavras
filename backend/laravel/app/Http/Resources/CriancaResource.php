<?php

namespace App\Http\Resources;

use App\Models\Crianca;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Criança vista pelo adulto. Nunca expõe o hash da figura secreta nem outro
 * dado pessoal além de apelido, avatar e turma (LGPD).
 *
 * @mixin Crianca
 */
class CriancaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $consentimento = $this->consentimentoVigente;

        return [
            'id' => $this->id,
            'apelido' => $this->apelido,
            'avatar' => $this->avatar ? new OpcaoVisualResource($this->avatar) : null,
            'usa_minusculas' => (bool) $this->usa_minusculas,
            'narracao_automatica' => (bool) $this->narracao_automatica,
            'turma' => $this->turma ? ['id' => $this->turma->id, 'nome' => $this->turma->nome, 'codigo' => $this->turma->codigo] : null,
            'responsavel' => $this->responsavel ? ['id' => $this->responsavel->id, 'name' => $this->responsavel->name] : null,
            'bloqueada_ate' => $this->estaBloqueada() ? $this->bloqueada_ate : null,
            'exclusao_solicitada_em' => $this->exclusao_solicitada_em,
            'consentimento' => $consentimento ? [
                'versao_texto' => $consentimento->versao_texto,
                'aceito_em' => $consentimento->aceito_em,
            ] : null,
            'created_at' => $this->created_at,
        ];
    }
}
