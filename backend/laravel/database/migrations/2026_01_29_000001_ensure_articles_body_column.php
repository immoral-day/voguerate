<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('articles')) {
            return;
        }

        Schema::table('articles', function (Blueprint $table) {
            if (!Schema::hasColumn('articles', 'body')) {
                $table->text('body')->nullable()->after('title');
            }
            if (!Schema::hasColumn('articles', 'slug')) {
                $table->string('slug')->nullable()->after('title');
            }
            if (!Schema::hasColumn('articles', 'excerpt')) {
                $table->string('excerpt')->nullable()->after('slug');
            }
            if (!Schema::hasColumn('articles', 'image')) {
                $table->string('image')->nullable()->after('body');
            }
        });
    }

    public function down(): void
    {
        //
    }
};
