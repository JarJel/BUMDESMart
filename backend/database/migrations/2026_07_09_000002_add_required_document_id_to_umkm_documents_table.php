<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('umkm_documents', function (Blueprint $table) {
            $table->foreignId('required_document_id')
                ->nullable()
                ->after('umkm_profile_id')
                ->constrained('bumdes_required_documents')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('umkm_documents', function (Blueprint $table) {
            $table->dropForeign(['required_document_id']);
            $table->dropColumn('required_document_id');
        });
    }
};
