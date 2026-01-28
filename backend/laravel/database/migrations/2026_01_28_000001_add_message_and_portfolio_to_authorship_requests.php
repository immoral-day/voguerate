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

        Schema::table('authorship_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('authorship_requests', 'message')) {
                $table->text('message')->nullable()->after('status');
            }

            if (!Schema::hasColumn('authorship_requests', 'portfolio_link')) {
                $table->string('portfolio_link')->nullable()->after('message');
            }

            if (!Schema::hasColumn('authorship_requests', 'admin_comment')) {
                $table->text('admin_comment')->nullable()->after('portfolio_link');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('authorship_requests')) {
            return;
        }

        Schema::table('authorship_requests', function (Blueprint $table) {
            if (Schema::hasColumn('authorship_requests', 'admin_comment')) {
                $table->dropColumn('admin_comment');
            }
            if (Schema::hasColumn('authorship_requests', 'portfolio_link')) {
                $table->dropColumn('portfolio_link');
            }
            if (Schema::hasColumn('authorship_requests', 'message')) {
                $table->dropColumn('message');
            }
        });
    }
};

