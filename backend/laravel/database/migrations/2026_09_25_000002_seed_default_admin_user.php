<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Cria/atualiza o administrador inicial a partir de ADMIN_NAME, ADMIN_EMAIL e
 * ADMIN_PASSWORD do .env. Com qualquer um vazio, não faz nada.
 */
return new class extends Migration
{
    public function up(): void
    {
        $adminName = trim((string) env('ADMIN_NAME', ''));
        $adminEmail = Str::lower(trim((string) env('ADMIN_EMAIL', '')));
        $adminPassword = (string) env('ADMIN_PASSWORD', '');

        if ($adminName === '' || $adminEmail === '' || $adminPassword === '') {
            return;
        }

        if (! filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException('ADMIN_EMAIL precisa ser um e-mail valido.');
        }

        if (strlen($adminPassword) < 12) {
            throw new RuntimeException('ADMIN_PASSWORD precisa ter ao menos 12 caracteres.');
        }

        DB::table('users')->upsert(
            [[
                'name' => $adminName,
                'email' => $adminEmail,
                'password' => Hash::make($adminPassword),
                'role' => 'admin',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]],
            ['email'],
            ['name', 'password', 'role', 'is_active', 'updated_at']
        );
    }

    public function down(): void
    {
        $adminEmail = Str::lower(trim((string) env('ADMIN_EMAIL', '')));

        if ($adminEmail !== '') {
            DB::table('users')->where('email', $adminEmail)->delete();
        }
    }
};
