<?php

namespace App\Console\Commands;

use App\Models\Gravacao;
use App\Services\MiniAulas\MiniAulaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * Purga de áudios de crianças (LGPD): apaga do disco privado as gravações
 * recusadas/removidas há mais de N dias e as de crianças excluídas.
 * Agendado diariamente em routes/console.php.
 */
class LimparGravacoes extends Command
{
    protected $signature = 'teia:limpar-gravacoes {--dias=7 : Idade mínima (dias) das gravações recusadas/removidas}';

    protected $description = 'Apaga do disco os áudios recusados, removidos ou de crianças excluídas';

    public function handle(): int
    {
        $limite = now()->subDays((int) $this->option('dias'));
        $apagadas = 0;

        $alvo = Gravacao::withTrashed()
            ->where(function ($q) use ($limite) {
                $q->where(fn ($w) => $w->whereNotNull('deleted_at')->where('deleted_at', '<=', $limite))
                    ->orWhere(fn ($w) => $w->where('status', Gravacao::RECUSADA)->where('updated_at', '<=', $limite))
                    ->orWhereHas('crianca', fn ($c) => $c->onlyTrashed());
            })
            ->get();

        foreach ($alvo as $gravacao) {
            Storage::disk(MiniAulaService::DISCO)->delete($gravacao->arquivo_path);
            $gravacao->forceDelete();
            $apagadas++;
        }

        $this->info("Gravações apagadas: {$apagadas}.");

        return self::SUCCESS;
    }
}
