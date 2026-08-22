<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->renameColumn('xendit_invoice_id', 'snap_token');
            $table->renameColumn('xendit_external_id', 'midtrans_order_id');
            $table->renameColumn('xendit_data', 'payment_data');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->renameColumn('snap_token', 'xendit_invoice_id');
            $table->renameColumn('midtrans_order_id', 'xendit_external_id');
            $table->renameColumn('payment_data', 'xendit_data');
        });
    }
};
