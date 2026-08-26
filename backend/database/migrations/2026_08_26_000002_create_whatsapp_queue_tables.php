<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_queue', function (Blueprint $table) {
            $table->id();
            $table->string('phone', 20);
            $table->text('message');
            $table->string('context', 100)->nullable();        // misal: 'order_notif', 'manual'
            $table->string('status', 20)->default('pending');  // pending|processing|retrying|sent|failed
            $table->unsignedTinyInteger('attempt')->default(0);
            $table->unsignedTinyInteger('max_attempts')->default(3);
            $table->unsignedSmallInteger('retry_delay')->default(60); // detik
            $table->timestamp('next_retry_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();

            $table->index(['status', 'next_retry_at']);
        });

        Schema::create('whatsapp_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('queue_id')->constrained('whatsapp_queue')->cascadeOnDelete();
            $table->unsignedTinyInteger('attempt');
            $table->string('status', 20); // sent|failed
            $table->text('error')->nullable();
            $table->timestamp('executed_at');
        });

        // Tambah setting WA ke tabel settings
        DB::table('settings')->insertOrIgnore([
            ['key' => 'wa_max_attempts', 'value' => '3',  'description' => 'Maks percobaan kirim WA (1-5)',        'created_at' => now(), 'updated_at' => now()],
            ['key' => 'wa_retry_delay',  'value' => '60', 'description' => 'Jeda antar percobaan WA (detik)',      'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_logs');
        Schema::dropIfExists('whatsapp_queue');
    }
};
