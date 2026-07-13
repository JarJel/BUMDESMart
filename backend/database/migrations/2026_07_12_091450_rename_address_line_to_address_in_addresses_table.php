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
        if (Schema::hasColumn('addresses', 'address_line')) {
            Schema::table('addresses', function (Blueprint $table) {
                $table->renameColumn('address_line', 'address');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('addresses', 'address')) {
            Schema::table('addresses', function (Blueprint $table) {
                $table->renameColumn('address', 'address_line');
            });
        }
    }
};
