<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // Default settings
        DB::table('settings')->insert([
            ['key' => 'site_name',        'value' => 'BumDesMartNukita',              'description' => 'Nama platform',             'created_at' => now(), 'updated_at' => now()],
            ['key' => 'site_tagline',     'value' => 'Dari Desa, Untuk Semua',  'description' => 'Tagline platform',          'created_at' => now(), 'updated_at' => now()],
            ['key' => 'contact_email',    'value' => 'bumdesmart00@gmail.com',   'description' => 'Email kontak resmi',        'created_at' => now(), 'updated_at' => now()],
            ['key' => 'contact_phone',    'value' => '',                         'description' => 'Nomor telepon kontak',      'created_at' => now(), 'updated_at' => now()],
            ['key' => 'maintenance_mode',      'value' => '0', 'description' => 'Mode maintenance (0/1)',                          'created_at' => now(), 'updated_at' => now()],
            ['key' => 'payment_qris_enabled',  'value' => '1', 'description' => 'Aktifkan metode bayar QRIS/transfer langsung ke UMKM (0/1)', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'payment_midtrans_enabled', 'value' => '1', 'description' => 'Aktifkan metode bayar via Midtrans (0/1)',                'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
