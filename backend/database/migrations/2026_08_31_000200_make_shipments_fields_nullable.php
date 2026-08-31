<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->foreignId('shipping_service_id')->nullable()->change();
            $table->decimal('shipping_cost', 15, 2)->nullable()->default(0)->change();
        });
    }

    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->foreignId('shipping_service_id')->nullable(false)->change();
            $table->decimal('shipping_cost', 15, 2)->nullable(false)->change();
        });
    }
};
