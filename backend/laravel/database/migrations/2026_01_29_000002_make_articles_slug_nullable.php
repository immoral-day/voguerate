<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('articles') || !Schema::hasColumn('articles', 'slug')) {
            return;
        }

        Schema::table('articles', function (Blueprint $table) {
            $table->string('slug')->nullable()->change();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('articles') || !Schema::hasColumn('articles', 'slug')) {
            return;
        }

        Schema::table('articles', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->change();
        });
    }
};
