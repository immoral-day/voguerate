<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('authorship_requests')) {
            return;
        }

        // В SQLite enum реализован через CHECK, поэтому проще всего
        // привести колонку к обычной строке без enum‑ограничения.
        Schema::table('authorship_requests', function (Blueprint $table) {
            $table->string('status', 32)->default('PENDING')->change();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('authorship_requests')) {
            return;
        }

        // Возвращать enum назад не обязательно, но оставим совместимый вариант.
        Schema::table('authorship_requests', function (Blueprint $table) {
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING')->change();
        });
    }
};

