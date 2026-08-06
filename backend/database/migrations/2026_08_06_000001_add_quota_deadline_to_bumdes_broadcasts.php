<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bumdes_broadcasts', function (Blueprint $table) {
            $table->unsignedSmallInteger('max_participants')->nullable()->after('allow_registration');
            $table->date('registration_deadline')->nullable()->after('max_participants');
        });
    }

    public function down(): void
    {
        Schema::table('bumdes_broadcasts', function (Blueprint $table) {
            $table->dropColumn(['max_participants', 'registration_deadline']);
        });
    }
};
