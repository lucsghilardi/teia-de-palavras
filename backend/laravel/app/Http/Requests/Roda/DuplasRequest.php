<?php

namespace App\Http\Requests\Roda;

use Illuminate\Foundation\Http\FormRequest;

/** `{ automatico: true }` ou `{ pares: [[a, b], ...] }`. */
class DuplasRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'automatico' => ['required_without:pares', 'boolean'],
            'pares' => ['required_without:automatico', 'array', 'max:40'],
            'pares.*' => ['array', 'size:2'],
            'pares.*.*' => ['integer'],
        ];
    }

    /** @return list<array{0: int, 1: int}>|null null = automático */
    public function pares(): ?array
    {
        if ($this->boolean('automatico')) {
            return null;
        }

        return array_map(fn ($par) => [(int) $par[0], (int) $par[1]], array_values((array) $this->validated('pares', [])));
    }
}
