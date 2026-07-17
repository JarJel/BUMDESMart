<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bumdes_profiles', function (Blueprint $table) {
            // Biaya layanan per pesanan yang dibebankan ke pembeli (flat Rp)
            $table->unsignedInteger('buyer_service_fee')->default(0)->after('fee_value');
        });

        Schema::table('orders', function (Blueprint $table) {
            // Biaya layanan BUMDes yang ditanggung pembeli (masuk total bayar)
            $table->unsignedInteger('service_fee')->default(0)->after('bumdes_fee');
        });
    }

    public function down(): void
    {
        Schema::table('bumdes_profiles', function (Blueprint $table) {
            $table->dropColumn('buyer_service_fee');
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('service_fee');
        });
    }
};
