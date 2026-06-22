<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipping_services', function (Blueprint $table) {
            $table->id();
            $table->string('courier_code');
            $table->string('service_code');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('estimated_days')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['courier_code', 'service_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipping_services');
    }
};
