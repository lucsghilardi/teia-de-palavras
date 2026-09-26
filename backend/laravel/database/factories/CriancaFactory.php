<?php

namespace Database\Factories;

use App\Models\Crianca;
use App\Models\Turma;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/** @extends Factory<Crianca> */
class CriancaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'turma_id' => Turma::factory(),
            'responsavel_user_id' => fn (array $atributos) => Turma::find($atributos['turma_id'])->educador_user_id,
            'apelido' => ucfirst(fake()->unique()->firstName()),
            'avatar_chave' => 'raposa',
            'figura_secreta_hash' => Hash::make('estrela'),
            'usa_minusculas' => false,
        ];
    }
}
