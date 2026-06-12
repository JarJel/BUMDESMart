<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('umkm_profile_id')->constrained('umkm_profile')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->text('description');
            $table->decimal('price', 15, 2);
            $table->integer('stock');
            $table->integer('weight');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->boolean('is_digital')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
