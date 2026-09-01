<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('settings')) {
            Schema::create('settings', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->text('value')->nullable();
                $table->string('description')->nullable();
                $table->timestamps();
            });
        }

        $defaults = [
            ['key' => 'payment_qris_enabled',    'value' => '1', 'description' => 'Aktifkan pembayaran QRIS'],
            ['key' => 'payment_midtrans_enabled', 'value' => '1', 'description' => 'Aktifkan pembayaran Midtrans'],
            ['key' => 'maintenance_mode',         'value' => '0', 'description' => 'Mode maintenance platform'],
        ];

        foreach ($defaults as $row) {
            DB::table('settings')->updateOrInsert(['key' => $row['key']], $row);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
