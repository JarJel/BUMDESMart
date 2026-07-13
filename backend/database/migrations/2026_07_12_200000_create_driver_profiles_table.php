<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('vehicle_type', ['motor', 'mobil', 'pickup', 'sepeda']);
            $table->string('vehicle_brand', 100)->nullable();
            $table->string('vehicle_plate', 20);
            $table->smallInteger('vehicle_year')->nullable();
            $table->string('sim_type', 10)->nullable();
            $table->string('id_number', 20)->nullable();
            $table->boolean('is_available')->default(true);
            $table->boolean('is_verified')->default(false);
            $table->unsignedInteger('total_deliveries')->default(0);
            $table->decimal('rating', 3, 2)->default(0.00);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_profiles');
    }
};
