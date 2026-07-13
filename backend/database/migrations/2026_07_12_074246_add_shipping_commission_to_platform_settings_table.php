<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('platform_settings')->insert([
            ['key' => 'shipping_base_cost',   'value' => '2000', 'label' => 'Biaya Dasar Ongkir (Rp)',    'group' => 'shipping', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'shipping_cost_per_km', 'value' => '1500', 'label' => 'Biaya per KM (Rp)',          'group' => 'shipping', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'commission_type',      'value' => 'flat', 'label' => 'Tipe Komisi (flat/percent)', 'group' => 'payment',  'created_at' => now(), 'updated_at' => now()],
            ['key' => 'commission_value',     'value' => '1000', 'label' => 'Nilai Komisi',               'group' => 'payment',  'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        DB::table('platform_settings')->whereIn('key', [
            'shipping_base_cost', 'shipping_cost_per_km', 'commission_type', 'commission_value',
        ])->delete();
    }
};
