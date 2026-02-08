<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Удаляет из базы все бейджи пользователей кроме ADMIN, DESIGNER, VERIFIED.
 */
return new class extends Migration
{
    private const ALLOWED_BADGES = ['ADMIN', 'DESIGNER', 'VERIFIED'];

    public function up(): void
    {
        $users = DB::table('users')->whereNotNull('badges')->get();
        foreach ($users as $user) {
            $badges = json_decode($user->badges, true);
            if (!is_array($badges)) {
                continue;
            }
            $sanitized = array_values(array_intersect($badges, self::ALLOWED_BADGES));
            if ($sanitized !== $badges) {
                DB::table('users')->where('id', $user->id)->update([
                    'badges' => json_encode($sanitized),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Не восстанавливаем старые бейджи — откат пустой
    }
};
