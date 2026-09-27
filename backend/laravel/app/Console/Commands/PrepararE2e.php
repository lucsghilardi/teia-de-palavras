<?php

namespace App\Console\Commands;

use App\Models\Crianca;
use App\Models\CriancaItem;
use App\Models\Gravacao;
use App\Models\MiniAula;
use App\Models\MiniAulaEntrega;
use App\Models\Turma;
use App\Models\TurmaSessao;
use App\Models\User;
use App\Services\Atividades\RegistroAtividades;
use App\Services\MiniAulas\MiniAulaService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Prepara o banco de desenvolvimento para o teste de ponta a ponta
 * (frontend/e2e): turma "E2E" com código fixo, dona de um educador só de
 * teste, e a criança "Teste" recriada (com um item vencido na Revisão e uma
 * mini-aula aprovada da colega "Bia" para jogar). Mexe só nessa turma.
 * Recusa rodar em produção.
 */
class PrepararE2e extends Command
{
    public const CODIGO = 'E2ETST';

    public const APELIDO = 'Teste';

    public const AVATAR = 'nave';

    public const FIGURA = 'estrela';

    public const COLEGA = 'Bia';

    /** Educador (não admin) dono da turma E2E: só enxerga os dados de teste. */
    public const EDUCADOR_EMAIL = 'e2e-educador@teia.local';

    protected $signature = 'teia:preparar-e2e {--json : Imprime só o JSON com os dados da criança}';

    protected $description = 'Cria/zera a turma E2E e a criança de teste usadas pelo Playwright';

    public function handle(): int
    {
        if (app()->environment('production')) {
            $this->error('Não roda em produção.');

            return self::FAILURE;
        }

        $this->callSilently('db:seed', ['--class' => DatabaseSeeder::class, '--force' => true]);

        // Conta própria do E2E, e não o primeiro admin do banco: o login do
        // teste da Roda funciona em qualquer banco. A senha muda a cada rodada
        // e só sai no JSON que o Playwright lê.
        $senha = Str::random(32);
        $educador = User::updateOrCreate(
            ['email' => self::EDUCADOR_EMAIL],
            ['name' => 'Educador E2E', 'password' => Hash::make($senha), 'role' => User::PAPEL_EDUCADOR, 'is_active' => true],
        );

        $turma = Turma::firstOrCreate(
            ['codigo' => self::CODIGO],
            ['educador_user_id' => $educador->id, 'nome' => 'E2E', 'ativa' => true],
        );
        $turma->update(['ativa' => true, 'educador_user_id' => $educador->id]);
        // Nenhuma roda sobra de uma rodada anterior.
        TurmaSessao::where('turma_id', $turma->id)->delete();

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
                'usa_minusculas' => true,
            ]);
            $crianca->definirFiguraSecreta(self::FIGURA);
            $crianca->save();

            $crianca->consentimentos()->create([
                'user_id' => $educador->id, 'versao_texto' => 'e2e', 'aceito_em' => now(), 'ip' => '127.0.0.1',
            ]);

            // Um item vencido na Revisão, para o E2E jogar a sessão do dia.
            CriancaItem::create([
                'crianca_id' => $crianca->id,
                'disciplina' => 'matematica',
                'chave' => 'fato:7+5',
                'dados' => ['tipo' => 'somar_subtrair', 'config' => ['itens' => [['a' => 7, 'b' => 5, 'operacao' => '+']], 'apoio' => 'icones', 'opcoes' => 3]],
                'caixa' => 0,
                'proxima_revisao_em' => today(),
            ]);

            $this->semearMiniAulaDaColega($turma, $educador, $crianca);

            return $crianca;
        });

        $dados = [
            'codigo' => self::CODIGO,
            'crianca_id' => $crianca->id,
            'apelido' => self::APELIDO,
            'figura' => self::FIGURA,
            'educador' => ['email' => self::EDUCADOR_EMAIL, 'senha' => $senha],
        ];

        if ($this->option('json')) {
            $this->line(json_encode($dados));
        } else {
            $this->info('Turma '.self::CODIGO.' pronta com a criança '.self::APELIDO.'.');
        }

        return self::SUCCESS;
    }

    /**
     * A colega "Bia" (mesma turma) já tem uma mini-aula aprovada — "qual sílaba
     * falta em tatu?" — entregue à criança de teste, com um áudio curto no
     * disco privado. Recriada a cada rodada.
     */
    private function semearMiniAulaDaColega(Turma $turma, User $educador, Crianca $crianca): void
    {
        $colega = Crianca::withTrashed()->firstOrCreate(
            ['turma_id' => $turma->id, 'apelido' => self::COLEGA],
            ['responsavel_user_id' => $educador->id, 'avatar_chave' => 'robo', 'figura_secreta_hash' => bcrypt('lua'), 'usa_minusculas' => true],
        );
        $colega->restore();

        MiniAula::where('autor_crianca_id', $colega->id)->get()->each(function (MiniAula $antiga) {
            if ($gravacao = $antiga->gravacao()->withTrashed()->first()) {
                Storage::disk(MiniAulaService::DISCO)->delete($gravacao->arquivo_path);
                $gravacao->forceDelete();
            }

            $antiga->delete();
        });

        $path = "mini-aulas/{$colega->id}/e2e-tatu.wav";
        Storage::disk(MiniAulaService::DISCO)->put($path, self::wavCurto());

        $gravacao = Gravacao::create([
            'crianca_id' => $colega->id, 'alvo_tipo' => 'mini_aula', 'arquivo_path' => $path,
            'duracao_ms' => 400, 'mime' => 'audio/wav', 'status' => Gravacao::APROVADA,
            'revisada_por_user_id' => $educador->id, 'revisada_em' => now(),
        ]);

        $config = RegistroAtividades::para('escolher_silaba')->validarConfig([
            'itens' => [['modo' => 'completar', 'palavra' => 'TATU', 'silabas' => ['TA', 'TU'], 'oculta' => 1, 'opcoes' => ['TO', 'TE', 'TU']]],
        ]);

        $mini = MiniAula::create([
            'autor_crianca_id' => $colega->id, 'disciplina' => 'portugues', 'modelo' => 'silaba:TATU',
            'titulo' => 'Qual sílaba falta em tatu?', 'tipo' => 'escolher_silaba', 'config' => $config,
            'gravacao_id' => $gravacao->id, 'status' => MiniAula::APROVADA,
            'revisada_por_user_id' => $educador->id, 'revisada_em' => now(),
        ]);
        $gravacao->update(['alvo_id' => $mini->id]);

        MiniAulaEntrega::create(['mini_aula_id' => $mini->id, 'crianca_id' => $crianca->id, 'status' => MiniAulaEntrega::RECEBIDA]);
    }

    /** WAV PCM de 0,4 s com um tom suave (8 kHz, mono): toca em qualquer navegador. */
    private static function wavCurto(): string
    {
        $taxa = 8000;
        $amostras = (int) ($taxa * 0.4);
        $dados = '';

        for ($i = 0; $i < $amostras; $i++) {
            $dados .= pack('v', (int) (sin($i * 2 * M_PI * 440 / $taxa) * 6000) & 0xFFFF);
        }

        return 'RIFF'.pack('V', 36 + strlen($dados)).'WAVE'
            .'fmt '.pack('VvvVVvv', 16, 1, 1, $taxa, $taxa * 2, 2, 16)
            .'data'.pack('V', strlen($dados)).$dados;
    }
}
