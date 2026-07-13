<?php

use Illuminate\Support\Facades\DB;
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
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('label');
            $table->string('group')->default('general');
            $table->timestamps();
        });

        // Seed default settings
        DB::table('platform_settings')->insert([
            ['key' => 'platform_name',      'value' => 'BUMDESMart',                        'label' => 'Nama Platform',           'group' => 'general',      'created_at' => now(), 'updated_at' => now()],
            ['key' => 'platform_tagline',   'value' => 'Platform Digital UMKM BUMDes',      'label' => 'Tagline Platform',        'group' => 'general',      'created_at' => now(), 'updated_at' => now()],
            ['key' => 'platform_email',     'value' => '',                                   'label' => 'Email Kontak Platform',   'group' => 'general',      'created_at' => now(), 'updated_at' => now()],
            ['key' => 'platform_phone',     'value' => '',                                   'label' => 'Nomor Telepon Platform',  'group' => 'general',      'created_at' => now(), 'updated_at' => now()],
            ['key' => 'platform_address',   'value' => '',                                   'label' => 'Alamat Platform',         'group' => 'general',      'created_at' => now(), 'updated_at' => now()],
            ['key' => 'maintenance_mode',   'value' => 'false',                              'label' => 'Mode Maintenance',        'group' => 'system',       'created_at' => now(), 'updated_at' => now()],
            ['key' => 'registration_open',  'value' => 'true',                               'label' => 'Pendaftaran Dibuka',      'group' => 'system',       'created_at' => now(), 'updated_at' => now()],
            ['key' => 'seller_auto_approve','value' => 'false',                              'label' => 'Auto-Approve Seller',     'group' => 'system',       'created_at' => now(), 'updated_at' => now()],
            ['key' => 'max_product_photos', 'value' => '5',                                  'label' => 'Maks. Foto Produk',       'group' => 'product',      'created_at' => now(), 'updated_at' => now()],
            ['key' => 'commission_rate',    'value' => '0',                                  'label' => 'Komisi Platform (%)',     'group' => 'payment',      'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};
