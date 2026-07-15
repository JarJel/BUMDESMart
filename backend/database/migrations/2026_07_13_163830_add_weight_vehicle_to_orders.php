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
        Schema::table('orders', function (Blueprint $table) {
            // Berat total order dalam gram — diisi saat checkout confirm
            $table->unsignedInteger('total_weight')->default(0)->after('total')->comment('grams');
            // Jenis kendaraan yang dipilih pembeli saat checkout
            $table->string('vehicle_type_required', 20)->nullable()->after('total_weight');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['total_weight', 'vehicle_type_required']);
        });
    }
};
