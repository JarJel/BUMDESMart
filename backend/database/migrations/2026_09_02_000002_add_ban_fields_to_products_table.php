<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('ban_reason')->nullable()->after('status');
            $table->unsignedBigInteger('banned_by_id')->nullable()->after('ban_reason');
            $table->timestamp('banned_at')->nullable()->after('banned_by_id');
            $table->string('ban_appeal')->nullable()->after('banned_at');
            $table->enum('ban_appeal_status', ['none', 'pending', 'reviewed'])->default('none')->after('ban_appeal');
        });

        // Tambah 'banned' ke enum status
        DB::statement("ALTER TABLE products MODIFY COLUMN status ENUM('active','inactive','draft','banned') NOT NULL DEFAULT 'draft'");
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['ban_reason', 'banned_by_id', 'banned_at', 'ban_appeal', 'ban_appeal_status']);
        });

        DB::statement("ALTER TABLE products MODIFY COLUMN status ENUM('active','inactive','draft') NOT NULL DEFAULT 'draft'");
    }
};
