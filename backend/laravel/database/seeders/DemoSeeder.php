<?php

namespace Database\Seeders;

use App\Models\Crianca;
use App\Models\Turma;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Só em ambiente local: turma "Casa" do primeiro admin com uma criança de
 * teste (apelido "Explorador", avatar raposa, figura secreta estrela), para
 * experimentar o app da criança sem cadastrar nada.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('role', User::PAPEL_ADMIN)->orderBy('id')->first();

        if ($admin === null) {
            $this->command?->warn('DemoSeeder: nenhum admin encontrado (defina ADMIN_* no .env e rode as migrations).');

            return;
        }

        $turma = Turma::firstOrCreate(
            ['educador_user_id' => $admin->id, 'nome' => 'Casa'],
            ['codigo' => Turma::gerarCodigo(), 'ativa' => true],
        );

        if (! $turma->criancas()->where('apelido', 'Explorador')->exists()) {
            $crianca = new Crianca([
                'turma_id' => $turma->id,
                'responsavel_user_id' => $admin->id,
                'apelido' => 'Explorador',
                'avatar_chave' => 'raposa',
            ]);
            $crianca->definirFiguraSecreta('estrela');
            $crianca->save();

            $crianca->consentimentos()->create([
                'user_id' => $admin->id,
                'versao_texto' => 'v1',
                'aceito_em' => now(),
                'ip' => '127.0.0.1',
            ]);
        }

        $this->command?->info("DemoSeeder: turma Casa, código {$turma->codigo}, criança Explorador (figura: estrela).");
    }
}
