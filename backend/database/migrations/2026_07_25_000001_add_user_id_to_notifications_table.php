<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Tambah user_id agar semua role (umkm, kurir, admin) bisa dapat notifikasi
            $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->cascadeOnDelete();
            $table->string('reference_type')->nullable()->after('type'); // order, product, dll
            $table->unsignedBigInteger('reference_id')->nullable()->after('reference_type');
            // customer_id jadi nullable agar backward compatible
            $table->foreignId('customer_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['user_id', 'reference_type', 'reference_id']);
        });
    }
};
