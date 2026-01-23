<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->unique()->after('name');
            $table->string('avatar')->nullable()->after('username');
            $table->integer('reputation')->default(0)->after('avatar');
            $table->integer('reviews_count')->default(0)->after('reputation');
            $table->enum('role', ['USER', 'DESIGNER', 'ADMIN'])->default('USER')->after('reviews_count');
            $table->text('bio')->nullable()->after('role');
            $table->date('joined_date')->nullable()->after('bio');
            $table->json('favorite_designers')->nullable()->after('joined_date');
            $table->json('favorites')->nullable()->after('favorite_designers');
            $table->json('wardrobe')->nullable()->after('favorites');
            $table->json('badges')->nullable()->after('wardrobe');
            $table->json('following')->nullable()->after('badges');
            $table->json('followers')->nullable()->after('following');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'username', 'avatar', 'reputation', 'reviews_count', 'role',
                'bio', 'joined_date', 'favorite_designers', 'favorites',
                'wardrobe', 'badges', 'following', 'followers'
            ]);
        });
    }
};
