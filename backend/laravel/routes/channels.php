<?php

use App\Broadcasting\RodaChannel;
use Illuminate\Support\Facades\Broadcast;

/*
| Canais do Reverb. SEMPRE com ['guards' => ['api', 'crianca']]: o callback
| recebe o usuário do guard que autenticou (User do educador ou Crianca), e as
| rotas /api/broadcasting/auth (adulto) e /api/crianca/broadcasting/auth
| (criança) aceitam os dois.
*/

// Modo turma: um canal de presença por Roda (docs/api-roda.md).
Broadcast::channel('roda.{rodaId}', RodaChannel::class, ['guards' => ['api', 'crianca']]);
