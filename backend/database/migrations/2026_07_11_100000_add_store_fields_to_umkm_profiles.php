<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('umkm_profiles', function (Blueprint $table) {
            $table->string('halal_cert')->nullable()->after('nib');
            $table->decimal('rating', 3, 2)->nullable()->after('halal_cert');
        });
    }

    public function down(): void
    {
        Schema::table('umkm_profiles', function (Blueprint $table) {
            $table->dropColumn(['halal_cert', 'rating']);
        });
    }
};
