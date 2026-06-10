<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('review_likes')) {
            DB::statement('CREATE INDEX IF NOT EXISTS review_likes_review_id_index ON review_likes (review_id)');
        }

        if (Schema::hasTable('clothing_items')) {
            DB::statement('CREATE INDEX IF NOT EXISTS clothing_items_category_index ON clothing_items (category)');
            DB::statement('CREATE INDEX IF NOT EXISTS clothing_items_brand_index ON clothing_items (brand)');
        }

        if (Schema::hasTable('chat_messages')) {
            DB::statement('CREATE INDEX IF NOT EXISTS chat_messages_created_at_index ON chat_messages (created_at)');
        }

        if (Schema::hasTable('users')) {
            DB::statement(
                'CREATE INDEX IF NOT EXISTS users_ban_visibility_index '
                . 'ON users (banned_permanently, banned_until)'
            );
        }
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS review_likes_review_id_index');
        DB::statement('DROP INDEX IF EXISTS clothing_items_category_index');
        DB::statement('DROP INDEX IF EXISTS clothing_items_brand_index');
        DB::statement('DROP INDEX IF EXISTS chat_messages_created_at_index');
        DB::statement('DROP INDEX IF EXISTS users_ban_visibility_index');
    }
};
