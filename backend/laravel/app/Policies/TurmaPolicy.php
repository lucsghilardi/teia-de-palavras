<?php

namespace App\Policies;

use App\Models\Turma;
use App\Models\User;

/** Educador só enxerga e mexe nas próprias turmas; admin em todas. */
class TurmaPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function view(User $user, Turma $turma): bool
    {
        return $this->ehDona($user, $turma);
    }

    public function update(User $user, Turma $turma): bool
    {
        return $this->ehDona($user, $turma);
    }

    public function delete(User $user, Turma $turma): bool
    {
        return $this->ehDona($user, $turma);
    }

    private function ehDona(User $user, Turma $turma): bool
    {
        return $user->ehAdmin() || (int) $turma->educador_user_id === (int) $user->id;
    }
}
