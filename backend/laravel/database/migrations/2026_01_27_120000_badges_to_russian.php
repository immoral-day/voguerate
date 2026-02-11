<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Переводит бейджи в БД на русские: VERIFIED→ВЕРИФИЦИРОВАН, DESIGNER→ДИЗАЙНЕР, ADMIN→АДМИН.
 */
return new class extends Migration
{
    private const MAP = [
        'VERIFIED' => 'ВЕРИФИЦИРОВАН',
        'DESIGNER' => 'ДИЗАЙНЕР',
        'ADMIN' => 'АДМИН',
    ];

    public function up(): void
    {
        $users = DB::table('users')->whereNotNull('badges')->get();
        foreach ($users as $user) {
            $badges = json_decode($user->badges, true);
            if (!is_array($badges)) {
                continue;
            }
            $updated = array_values(array_map(function ($b) {
                return self::MAP[$b] ?? $b;
            }, $badges));
            $updated = array_values(array_unique($updated));
            if (json_encode($updated) !== json_encode($badges)) {
                DB::table('users')->where('id', $user->id)->update([
                    'badges' => json_encode($updated),
                ]);
            }
        }
    }

    public function down(): void
    {
        $reverse = array_flip(self::MAP);
        $users = DB::table('users')->whereNotNull('badges')->get();
        foreach ($users as $user) {
            $badges = json_decode($user->badges, true);
            if (!is_array($badges)) {
                continue;
            }
            $updated = array_values(array_map(function ($b) use ($reverse) {
                return $reverse[$b] ?? $b;
            }, $badges));
            $updated = array_values(array_unique($updated));
            if (json_encode($updated) !== json_encode($badges)) {
                DB::table('users')->where('id', $user->id)->update([
                    'badges' => json_encode($updated),
                ]);
            }
        }
    }
};
