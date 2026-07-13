<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bumdes_profiles', function (Blueprint $table) {
            $table->enum('fee_type', ['percent', 'flat'])->nullable()->after('description');
            $table->decimal('fee_value', 8, 2)->default(0)->after('fee_type');
        });
    }

    public function down(): void
    {
        Schema::table('bumdes_profiles', function (Blueprint $table) {
            $table->dropColumn(['fee_type', 'fee_value']);
        });
    }
};
