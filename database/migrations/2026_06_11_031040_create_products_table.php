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
            $table->bigInt('umkm_profile_id')->constrained('umkm_profile')->cascadeOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->bigInt('category_id')->constrained('categories')->cascadeOnDelete();
            $table->text('description');
            $table->decimal('price', 15, 2);
            $table->bigInt('stock');
            $table->bigInt('weight');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->boolean('is_digital')->default(false);
            $table->timestamp('created_at');
            $table->timestamp('updated_at');
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
