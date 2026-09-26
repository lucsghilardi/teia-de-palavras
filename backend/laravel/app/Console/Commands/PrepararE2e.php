<?php

namespace App\Console\Commands;

use App\Models\Crianca;
use App\Models\Turma;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Prepara o banco de desenvolvimento para o teste de ponta a ponta
 * (frontend/e2e): turma "E2E" com código fixo e a criança "Teste" recriada.
 * Mexe só nessa turma. Recusa rodar em produção.
 */
class PrepararE2e extends Command
{
    public const CODIGO = 'E2ETST';

    public const APELIDO = 'Teste';

    public const AVATAR = 'coruja';

    public const FIGURA = 'estrela';

    protected $signature = 'teia:preparar-e2e {--json : Imprime só o JSON com os dados da criança}';

    protected $description = 'Cria/zera a turma E2E e a criança de teste usadas pelo Playwright';

    public function handle(): int
    {
        if (app()->environment('production')) {
            $this->error('Não roda em produção.');

            return self::FAILURE;
        }

        $this->callSilently('db:seed', ['--class' => DatabaseSeeder::class, '--force' => true]);

        $educador = User::where('role', User::PAPEL_ADMIN)->orderBy('id')->first()
            ?? User::factory()->admin()->create(['email' => 'e2e-admin@teia.local']);

        $turma = Turma::firstOrCreate(
            ['codigo' => self::CODIGO],
            ['educador_user_id' => $educador->id, 'nome' => 'E2E', 'ativa' => true],
        );
        $turma->update(['ativa' => true]);

        // Recria a criança a cada rodada: progresso zerado e id novo, o que
        // também zera o teto de tentativas de entrada (chave = criança + IP)
        // sem afrouxar a proteção de verdade.
        $crianca = DB::transaction(function () use ($turma, $educador) {
            Crianca::withTrashed()
                ->where('turma_id', $turma->id)
                ->where('apelido', self::APELIDO)
                ->get()
                ->each(fn (Crianca $antiga) => $antiga->forceDelete());

            $crianca = new Crianca([
                'turma_id' => $turma->id,
                'responsavel_user_id' => $educador->id,
                'apelido' => self::APELIDO,
                'avatar_chave' => self::AVATAR,
                'usa_minusculas' => false,
            ]);
            $crianca->definirFiguraSecreta(self::FIGURA);
            $crianca->save();

            $crianca->consentimentos()->create([
                'user_id' => $educador->id, 'versao_texto' => 'e2e', 'aceito_em' => now(), 'ip' => '127.0.0.1',
            ]);

            return $crianca;
        });

        $dados = [
            'codigo' => self::CODIGO,
            'crianca_id' => $crianca->id,
            'apelido' => self::APELIDO,
            'figura' => self::FIGURA,
        ];

        if ($this->option('json')) {
            $this->line(json_encode($dados));
        } else {
            $this->info('Turma '.self::CODIGO.' pronta com a criança '.self::APELIDO.'.');
        }

        return self::SUCCESS;
    }
}
