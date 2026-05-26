<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->index('created_at');
            $table->index(['user_id', 'created_at']);
            $table->index(['clothing_item_id', 'created_at']);
        });

        Schema::table('clothing_items', function (Blueprint $table) {
            $table->index('average_rating');
            $table->index('release_date');
        });

        Schema::table('drops', function (Blueprint $table) {
            $table->index('release_date');
        });

        Schema::table('articles', function (Blueprint $table) {
            $table->index('created_at');
            $table->index(['topic', 'created_at']);
        });

    }

    public function down(): void
    {
        Schema::table('reviews', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropIndex(['clothing_item_id', 'created_at']);
        });

        Schema::table('clothing_items', function (Blueprint $table) {
            $table->dropIndex(['average_rating']);
            $table->dropIndex(['release_date']);
        });

        Schema::table('drops', function (Blueprint $table) {
            $table->dropIndex(['release_date']);
        });

        Schema::table('articles', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['topic', 'created_at']);
        });

    }
};
