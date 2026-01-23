<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clothing_items', function (Blueprint $table) {
            $table->id();
            $table->string('brand');
            $table->string('name');
            $table->string('image');
            $table->json('images')->nullable();
            $table->date('release_date');
            $table->integer('average_rating')->default(0);
            $table->integer('rating_count')->default(0);
            $table->enum('type', ['SINGLE_LOOK', 'COLLECTION'])->default('SINGLE_LOOK');
            $table->enum('category', ['Streetwear', 'Luxury', 'Techwear', 'Vintage']);
            $table->integer('price');
            $table->json('tags')->nullable();
            $table->json('sizes')->nullable();
            $table->json('colors')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clothing_items');
    }
};
