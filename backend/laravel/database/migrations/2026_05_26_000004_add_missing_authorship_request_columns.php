<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('authorship_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('authorship_requests', 'brand_name')) {
                $table->string('brand_name')->nullable()->after('status');
            }
            if (!Schema::hasColumn('authorship_requests', 'description')) {
                $table->text('description')->nullable()->after('brand_name');
            }
            if (!Schema::hasColumn('authorship_requests', 'reason')) {
                $table->string('reason')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('authorship_requests', function (Blueprint $table) {
            if (Schema::hasColumn('authorship_requests', 'reason')) {
                $table->dropColumn('reason');
            }
            if (Schema::hasColumn('authorship_requests', 'description')) {
                $table->dropColumn('description');
            }
            if (Schema::hasColumn('authorship_requests', 'brand_name')) {
                $table->dropColumn('brand_name');
            }
        });
    }
};
