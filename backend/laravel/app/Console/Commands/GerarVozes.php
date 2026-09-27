<?php

namespace App\Console\Commands;

use App\Services\Voz\ColetorDeFalas;
use App\Services\Voz\VozService;
use Illuminate\Console\Command;

/**
 * Aquece a voz neural: sintetiza de uma vez tudo o que a criança pode ouvir
 * vindo do conteúdo, para ninguém esperar a primeira geração no meio da aula.
 * Idempotente (pula o que já existe) e respeita o orçamento mensal. Rodar
 * depois de semear/reaplicar conteúdo ou trocar de voz; não é agendado.
 */
class GerarVozes extends Command
{
    protected $signature = 'teia:gerar-vozes
        {--todas : Inclui as missões não publicadas}
        {--arquivo= : Frases extras, uma por linha ("-" lê da entrada padrão)}
        {--so-contar : Só mostra quantas frases e caracteres faltam gerar}';

    protected $description = 'Gera (aquece) a voz neural de todo o conteúdo que a criança ouve';

    public function handle(VozService $vozes, ColetorDeFalas $coletor): int
    {
        $soContar = (bool) $this->option('so-contar');

        if (! $vozes->ativa() && ! $soContar) {
            $this->warn('Voz neural desativada: configure TEIA_VOZ_PROVEDOR e TEIA_VOZ_CHAVE no .env.');

            return self::INVALID;
        }

        $maxChars = (int) config('teia.voz.max_chars', 300);
        $limiteMes = (int) config('teia.voz.limite_mensal_chars', 900000);

        $frases = collect([...$coletor->coletar((bool) $this->option('todas')), ...$this->extras()])
            ->map(fn (string $f) => VozService::normalizar($f))
            ->filter(fn (string $f) => $f !== '' && mb_strlen($f) <= $maxChars)
            ->unique()
            ->values();

        $faltam = $frases->filter(fn (string $f) => $vozes->existente($f) === null)->values();
        $chars = $faltam->sum(fn (string $f) => mb_strlen($f));

        $this->line(sprintf(
            'Frases do conteúdo: %d (%d já geradas). Faltam %d frases, %d caracteres. Uso do mês: %d de %d.',
            $frases->count(), $frases->count() - $faltam->count(), $faltam->count(), $chars, VozService::usoDoMes(), $limiteMes,
        ));

        if ($soContar || $faltam->isEmpty()) {
            return self::SUCCESS;
        }

        $geradas = 0;
        $puladas = 0;
        $semOrcamento = false;

        $this->withProgressBar($faltam, function (string $frase) use ($vozes, $limiteMes, &$geradas, &$puladas, &$semOrcamento) {
            if ($semOrcamento || VozService::usoDoMes() + mb_strlen($frase) > $limiteMes) {
                $semOrcamento = true;
                $puladas++;

                return;
            }

            if ($vozes->gerar($frase) === null) {
                $puladas++;
            } else {
                $geradas++;
            }
        });

        $this->newLine();

        if ($semOrcamento) {
            $this->warn('Orçamento mensal de caracteres esgotado: o resto fica para o mês que vem (ou suba TEIA_VOZ_LIMITE_MENSAL_CHARS).');
        }

        $this->info("Vozes geradas: {$geradas}. Já existiam: ".($frases->count() - $faltam->count()).". Puladas: {$puladas}.");

        return self::SUCCESS;
    }

    /** @return list<string> */
    private function extras(): array
    {
        $arquivo = $this->option('arquivo');

        if (! is_string($arquivo) || $arquivo === '') {
            return [];
        }

        $conteudo = $arquivo === '-' ? stream_get_contents(STDIN) : @file_get_contents($arquivo);

        if ($conteudo === false) {
            $this->warn("Não consegui ler {$arquivo}; seguindo só com o conteúdo.");

            return [];
        }

        return array_values(array_filter(array_map('trim', preg_split('/\R/', $conteudo) ?: [])));
    }
}
