<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('drops', function (Blueprint $table) {
            $table->json('copped_by')->nullable()->after('drop_count');
        });
    }

    public function down(): void
    {
        Schema::table('drops', function (Blueprint $table) {
            $table->dropColumn('copped_by');
        });
    }
};
