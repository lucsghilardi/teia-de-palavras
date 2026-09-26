<?php

namespace App\Policies;

use App\Models\Crianca;
use App\Models\User;

/** A criança é vista pelo educador da turma dela (e pelo admin). */
class CriancaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Crianca $crianca): bool
    {
        return $this->cuida($user, $crianca);
    }

    public function update(User $user, Crianca $crianca): bool
    {
        return $this->cuida($user, $crianca);
    }

    public function delete(User $user, Crianca $crianca): bool
    {
        return $this->cuida($user, $crianca);
    }

    private function cuida(User $user, Crianca $crianca): bool
    {
        if ($user->ehAdmin()) {
            return true;
        }

        $crianca->loadMissing('turma');

        return (int) $crianca->turma?->educador_user_id === (int) $user->id;
    }
}
