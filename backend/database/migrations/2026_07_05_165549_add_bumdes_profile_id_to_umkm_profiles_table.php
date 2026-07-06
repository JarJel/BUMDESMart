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
            $table->foreignId('bumdes_profile_id')->nullable()->after('user_id')->constrained('bumdes_profiles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('umkm_profiles', function (Blueprint $table) {
            $table->dropForeign(['bumdes_profile_id']);
            $table->dropColumn('bumdes_profile_id');
        });
    }
};
