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
        Schema::table('inventory_counts', function (Blueprint $table) {
            $table->dropColumn(['created_by', 'updated_by']);
        });

        Schema::table('inventory_counts', function (Blueprint $table) {
            $table->foreignId('created_by')->after('count')->constrained('users')->onDelete('cascade');
            $table->foreignId('updated_by')->after('created_by')->constrained('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_counts', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['updated_by']);
            $table->dropColumn(['created_by', 'updated_by']);
        });

        Schema::table('inventory_counts', function (Blueprint $table) {
            $table->string('created_by', 100)->after('count');
            $table->string('updated_by', 100)->nullable()->after('created_by');
        });
    }
};
