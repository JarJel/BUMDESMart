<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('umkm_profiles', function (Blueprint $table) {
            $table->boolean('agreed_to_terms')->default(false)->after('business_category');
            $table->timestamp('agreed_at')->nullable()->after('agreed_to_terms');
        });
    }

    public function down(): void
    {
        Schema::table('umkm_profiles', function (Blueprint $table) {
            $table->dropColumn(['agreed_to_terms', 'agreed_at']);
        });
    }
};
