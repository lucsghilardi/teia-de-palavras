<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// LGPD: áudios recusados/removidos e de crianças excluídas saem do disco todo dia.
Schedule::command('teia:limpar-gravacoes')->dailyAt('03:10');
