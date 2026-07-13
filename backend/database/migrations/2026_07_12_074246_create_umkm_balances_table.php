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
        Schema::create('umkm_balances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('owner_id');
            $table->string('owner_type');                              // 'umkm' | 'driver'
            $table->decimal('pending', 15, 2)->default(0);            // menunggu order selesai
            $table->decimal('available', 15, 2)->default(0);          // siap dicairkan
            $table->decimal('withdrawn', 15, 2)->default(0);          // sudah dicairkan
            $table->unique(['owner_id', 'owner_type']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('umkm_balances');
    }
};
