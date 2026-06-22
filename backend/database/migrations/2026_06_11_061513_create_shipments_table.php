<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained('orders')->cascadeOnDelete();
            $table->foreignId('shipping_service_id')->constrained('shipping_services')->restrictOnDelete();
            $table->string('tracking_number')->nullable()->unique();
            $table->integer('weight')->nullable()->comment('grams');
            $table->decimal('shipping_cost', 15, 2);
            $table->enum('status', [
                'pending', 'picked_up', 'in_transit',
                'out_for_delivery', 'delivered', 'failed', 'returned',
            ])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('estimated_delivery_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
