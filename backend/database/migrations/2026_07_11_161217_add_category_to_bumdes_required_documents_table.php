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
        Schema::table('bumdes_required_documents', function (Blueprint $table) {
            // NULL = berlaku semua kategori; string = khusus kategori tsb
            $table->string('category')->nullable()->after('is_required');
        });
    }

    public function down(): void
    {
        Schema::table('bumdes_required_documents', function (Blueprint $table) {
            $table->dropColumn('category');
        });
    }
};
