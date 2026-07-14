<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ganti enum: hapus sepeda, tambah pickup_box & pickup_bak
        DB::statement("ALTER TABLE driver_profiles MODIFY vehicle_type ENUM('motor','mobil','pickup_box','pickup_bak') NOT NULL");

        // Unique NIK — satu orang hanya boleh daftar 1 akun
        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->unique('id_number', 'driver_id_number_unique');
            $table->unique('vehicle_plate', 'driver_vehicle_plate_unique');
        });
    }

    public function down(): void
    {
        Schema::table('driver_profiles', function (Blueprint $table) {
            $table->dropUnique('driver_id_number_unique');
            $table->dropUnique('driver_vehicle_plate_unique');
        });
        DB::statement("ALTER TABLE driver_profiles MODIFY vehicle_type ENUM('motor','mobil','pickup','sepeda') NOT NULL");
    }
};
