<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('authorship_requests') || !Schema::hasColumn('users', 'brand_name')) {
            return;
        }

        $requests = DB::table('authorship_requests')
            ->orderBy('id')
            ->get(['id', 'user_id', 'status', 'brand_name']);

        foreach ($requests as $request) {
            $normalizedStatus = strtoupper(trim((string) $request->status));
            if ($normalizedStatus !== $request->status) {
                DB::table('authorship_requests')
                    ->where('id', $request->id)
                    ->update(['status' => $normalizedStatus]);
            }

            if ($normalizedStatus !== 'APPROVED') {
                continue;
            }

            $user = DB::table('users')->where('id', $request->user_id)->first();
            if (!$user) {
                continue;
            }

            $brandName = trim((string) $request->brand_name);
            if ($brandName === '') {
                $brandName = $user->username;
            }

            $badges = json_decode((string) ($user->badges ?? '[]'), true);
            if (!is_array($badges)) {
                $badges = [];
            }
            if (!in_array('ДИЗАЙНЕР', $badges, true)) {
                $badges[] = 'ДИЗАЙНЕР';
            }

            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'brand_name' => $brandName,
                    'role' => $user->role === 'ADMIN' ? 'ADMIN' : 'DESIGNER',
                    'badges' => json_encode(array_values($badges), JSON_UNESCAPED_UNICODE),
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        // Data normalization is intentionally irreversible.
    }
};
