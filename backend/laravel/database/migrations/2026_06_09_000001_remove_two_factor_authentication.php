<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('two_factor_codes');

        $columns = array_values(array_filter(
            ['two_factor_secret', 'two_factor_confirmed_at'],
            fn (string $column) => Schema::hasColumn('users', $column),
        ));

        if ($columns !== []) {
            Schema::table('users', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }
    }

    public function down(): void
    {
        // Two-factor authentication was intentionally removed from the project.
    }
};
