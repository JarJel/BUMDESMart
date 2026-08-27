<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('site_visits', function (Blueprint $table) {
            $table->id();
            $table->string('session_id', 64)->index();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();
            $table->string('page', 255)->nullable();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->date('visited_date')->index();
            $table->timestamps();

            // Index untuk query per hari/periode
            $table->index(['visited_date', 'session_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_visits');
    }
};
