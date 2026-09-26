<?php

namespace Database\Factories;

use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Turma> */
class TurmaFactory extends Factory
{
    public function definition(): array
    {
        return [
            'educador_user_id' => User::factory(),
            'nome' => 'Turma '.fake()->unique()->word(),
            'codigo' => fn () => Turma::gerarCodigo(),
            'ativa' => true,
        ];
    }
}
