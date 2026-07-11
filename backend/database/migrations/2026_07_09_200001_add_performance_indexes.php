<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Indexes untuk mempercepat query yang paling sering digunakan
return new class extends Migration
{
    public function up(): void
    {
        // products — filter status sangat sering dipakai
        Schema::table('products', function (Blueprint $table) {
            $table->index('status', 'idx_products_status');
            $table->index(['umkm_profile_id', 'status'], 'idx_products_umkm_status');
            $table->index(['category_id', 'status'], 'idx_products_category_status');
        });

        // product_discounts — query activeDiscount dipakai di setiap load produk
        Schema::table('product_discounts', function (Blueprint $table) {
            $table->index(['product_id', 'is_active'], 'idx_discounts_product_active');
            $table->index('umkm_profile_id', 'idx_discounts_umkm');
        });

        // umkm_profiles — filter status untuk verifikasi admin
        Schema::table('umkm_profiles', function (Blueprint $table) {
            $table->index('status', 'idx_umkm_status');
            $table->index(['bumdes_profile_id', 'status'], 'idx_umkm_bumdes_status');
        });

        // orders — saat order feature dibangun, sudah siap
        Schema::table('orders', function (Blueprint $table) {
            $table->index('status', 'idx_orders_status');
            $table->index(['customer_id', 'status'], 'idx_orders_customer_status');
            $table->index(['umkm_profile_id', 'status'], 'idx_orders_umkm_status');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('idx_products_status');
            $table->dropIndex('idx_products_umkm_status');
            $table->dropIndex('idx_products_category_status');
        });

        Schema::table('product_discounts', function (Blueprint $table) {
            $table->dropIndex('idx_discounts_product_active');
            $table->dropIndex('idx_discounts_umkm');
        });

        Schema::table('umkm_profiles', function (Blueprint $table) {
            $table->dropIndex('idx_umkm_status');
            $table->dropIndex('idx_umkm_bumdes_status');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_status');
            $table->dropIndex('idx_orders_customer_status');
            $table->dropIndex('idx_orders_umkm_status');
        });
    }
};
