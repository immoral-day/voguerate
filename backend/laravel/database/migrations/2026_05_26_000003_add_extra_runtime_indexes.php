<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE INDEX IF NOT EXISTS users_banned_until_index ON users (banned_until)');
        DB::statement('CREATE INDEX IF NOT EXISTS users_reputation_index ON users (reputation)');
        DB::statement('CREATE INDEX IF NOT EXISTS review_reports_review_reporter_index ON review_reports (review_id, reporter_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS user_reports_reported_reporter_index ON user_reports (reported_user_id, reporter_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS chat_messages_sender_id_index ON chat_messages (sender_id)');
        DB::statement('CREATE INDEX IF NOT EXISTS chat_messages_recipient_id_index ON chat_messages (recipient_id)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS users_banned_until_index');
        DB::statement('DROP INDEX IF EXISTS users_reputation_index');
        DB::statement('DROP INDEX IF EXISTS review_reports_review_reporter_index');
        DB::statement('DROP INDEX IF EXISTS user_reports_reported_reporter_index');
        DB::statement('DROP INDEX IF EXISTS chat_messages_sender_id_index');
        DB::statement('DROP INDEX IF EXISTS chat_messages_recipient_id_index');
    }
};
