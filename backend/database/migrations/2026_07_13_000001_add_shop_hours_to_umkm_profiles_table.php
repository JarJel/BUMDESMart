<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('umkm_profiles', function (Blueprint $table) {
            $table->boolean('is_open')->default(true)->after('status');
            $table->json('open_hours')->nullable()->after('is_open');
            $table->timestamp('closed_until')->nullable()->after('open_hours');
        });
    }

    public function down(): void
    {
        Schema::table('umkm_profiles', function (Blueprint $table) {
            $table->dropColumn(['is_open', 'open_hours', 'closed_until']);
        });
    }
};
