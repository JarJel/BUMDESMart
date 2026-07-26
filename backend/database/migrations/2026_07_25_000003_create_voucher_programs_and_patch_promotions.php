<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Program voucher dari UMKM — tanpa kode, auto-apply di checkout seperti Shopee
        Schema::create('umkm_voucher_programs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('umkm_profile_id')->constrained('umkm_profiles')->cascadeOnDelete();
            // Trigger: syarat yang harus dipenuhi pembeli
            $table->string('trigger_type');    // item_count | order_amount | order_frequency
            $table->unsignedInteger('trigger_value'); // angka threshold (5 item / Rp200000 / 3x beli)
            // Reward: hadiah yang didapat
            $table->string('reward_type');     // flat | percentage | free_shipping
            $table->unsignedInteger('reward_value')->default(0); // nominal Rp atau persen
            $table->unsignedInteger('max_discount')->nullable();  // cap kalau percentage
            $table->string('label')->nullable(); // label tampilan: "Beli 5 item → diskon Rp 10.000"
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Tambah voucher_program_id ke promotions untuk tracking
        Schema::table('promotions', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->after('umkm_profile_id')
                  ->constrained('customers')->nullOnDelete();
            $table->foreignId('voucher_program_id')->nullable()->after('customer_id')
                  ->constrained('umkm_voucher_programs')->nullOnDelete();
            $table->boolean('is_auto_generated')->default(false)->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropForeign(['voucher_program_id']);
            $table->dropColumn(['customer_id', 'voucher_program_id', 'is_auto_generated']);
        });
        Schema::dropIfExists('umkm_voucher_programs');
    }
};
