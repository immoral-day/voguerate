<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Remove TOTP secret column (no longer needed for email-based 2FA)
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('two_factor_secret');
        });

        // Table for temporary email 2FA codes
        Schema::create('two_factor_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('code'); // hashed
            $table->timestamp('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('two_factor_codes');
        Schema::table('users', function (Blueprint $table) {
            $table->string('two_factor_secret')->nullable()->after('banned_until');
        });
    }
};
