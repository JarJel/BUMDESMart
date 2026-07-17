<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Histori pemasukan BUMDes per transaksi
        Schema::create('bumdes_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bumdes_profile_id')->constrained('bumdes_profiles')->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->enum('type', ['seller_fee', 'service_fee']); // seller_fee = dari UMKM, service_fee = dari pembeli
            $table->unsignedInteger('amount');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Broadcast / pengumuman dari BUMDes
        Schema::create('bumdes_broadcasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bumdes_profile_id')->constrained('bumdes_profiles')->cascadeOnDelete();
            $table->string('title');
            $table->enum('category', ['pengumuman', 'pelatihan', 'info_bantuan', 'jadwal', 'acara', 'promosi', 'sistem', 'undangan']);
            $table->text('content');
            $table->enum('target', ['all', 'umkm', 'driver', 'umkm_category']);
            $table->string('umkm_category')->nullable(); // jika target = umkm_category
            $table->unsignedInteger('recipient_count')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bumdes_broadcasts');
        Schema::dropIfExists('bumdes_transactions');
    }
};
