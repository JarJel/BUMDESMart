<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Aktifkan produk yang saat ini berstatus 'draft' milik UMKM yang sudah terverifikasi/aktif
        DB::table('products')
            ->where('status', 'draft')
            ->whereIn('umkm_profile_id', function ($query) {
                $query->select('id')
                    ->from('umkm_profiles')
                    ->where('status', 'active');
            })
            ->update(['status' => 'active']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak perlu revert status produk ke draft
    }
};

