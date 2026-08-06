<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bumdes_broadcasts', function (Blueprint $table) {
            $table->date('event_date')->nullable()->after('sent_at');
            $table->boolean('allow_registration')->default(false)->after('event_date');
        });

        Schema::create('broadcast_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('broadcast_id')->constrained('bumdes_broadcasts')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('registrant_type'); // 'umkm' | 'driver'
            $table->timestamps();
            $table->unique(['broadcast_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('broadcast_registrations');
        Schema::table('bumdes_broadcasts', function (Blueprint $table) {
            $table->dropColumn(['event_date', 'allow_registration']);
        });
    }
};
