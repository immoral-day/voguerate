<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'brand_name')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('brand_name', 80)->nullable()->after('username');
            });
        }

        if (!Schema::hasTable('authorship_requests') || !Schema::hasColumn('authorship_requests', 'brand_name')) {
            return;
        }

        $approvedRequests = DB::table('authorship_requests')
            ->whereRaw('UPPER(status) = ?', ['APPROVED'])
            ->whereNotNull('brand_name')
            ->where('brand_name', '!=', '')
            ->orderBy('id')
            ->get(['user_id', 'brand_name']);

        foreach ($approvedRequests as $request) {
            DB::table('users')
                ->where('id', $request->user_id)
                ->whereNull('brand_name')
                ->update(['brand_name' => trim($request->brand_name)]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'brand_name')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('brand_name');
            });
        }
    }
};
