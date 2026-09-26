<?php

namespace App\Policies;

use App\Models\Aula;
use App\Models\User;

/**
 * O conteúdo (aulas e dicionário) é compartilhado por todos os adultos do
 * painel. Apagar fica com o admin ou com quem criou a aula.
 */
class AulaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Aula $aula): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Aula $aula): bool
    {
        return true;
    }

    public function delete(User $user, Aula $aula): bool
    {
        return $user->ehAdmin() || (int) $aula->criada_por_user_id === (int) $user->id;
    }
}
