<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'banned_permanently')) {
            DB::table('users')
                ->whereNull('banned_permanently')
                ->update(['banned_permanently' => false]);
        }
    }

    public function down(): void
    {
        //
    }
};
