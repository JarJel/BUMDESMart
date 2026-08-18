<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->foreignId('driver_profile_id')->constrained('driver_profiles')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating'); // 1-5
            $table->string('comment', 500)->nullable();
            $table->timestamps();
            $table->unique(['order_id', 'customer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_reviews');
    }
};
