<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained('orders')->cascadeOnDelete();
            $table->string('xendit_invoice_id')->nullable()->unique();
            $table->string('xendit_external_id')->unique();
            $table->string('payment_code')->unique();
            $table->enum('channel', [
                'bank_transfer', 'ewallet', 'qris',
                'convenience_store', 'credit_card', 'cod',
            ])->nullable();
            $table->string('channel_code')->nullable();
            $table->decimal('amount', 15, 2);
            $table->decimal('fee_amount', 15, 2)->default(0);
            $table->json('xendit_data')->nullable();
            $table->enum('status', ['pending', 'paid', 'settled', 'expired', 'failed', 'refunded'])->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expired_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
