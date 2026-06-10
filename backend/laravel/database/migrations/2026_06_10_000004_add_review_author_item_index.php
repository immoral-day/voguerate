<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            'CREATE INDEX IF NOT EXISTS reviews_user_item_index '
            . 'ON reviews (user_id, clothing_item_id)'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS reviews_user_item_index');
    }
};
