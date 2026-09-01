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
        Schema::table('umkm_profiles', function (Blueprint $table) {
            $table->string('qris_image')->nullable()->after('banner');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_type')->default('midtrans')->after('order_id'); // 'midtrans' | 'manual_umkm'
            $table->string('proof_of_payment')->nullable()->after('payment_data');
            $table->string('rejection_reason')->nullable()->after('proof_of_payment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['payment_type', 'proof_of_payment', 'rejection_reason']);
        });

        Schema::table('umkm_profiles', function (Blueprint $table) {
            $table->dropColumn(['qris_image']);
        });
    }
};
