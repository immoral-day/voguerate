<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            'CREATE INDEX IF NOT EXISTS chat_messages_sender_recipient_id_index '
            . 'ON chat_messages (sender_id, recipient_id, id)'
        );
        DB::statement(
            'CREATE INDEX IF NOT EXISTS chat_messages_recipient_sender_id_index '
            . 'ON chat_messages (recipient_id, sender_id, id)'
        );
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS chat_messages_sender_recipient_id_index');
        DB::statement('DROP INDEX IF EXISTS chat_messages_recipient_sender_id_index');
    }
};
