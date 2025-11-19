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
            $table->foreignId('inventory_period_id')
                ->after('branch_id')
                ->constrained('inventory_periods')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_counts', function (Blueprint $table) {
            $table->dropForeign(['inventory_period_id']);
            $table->dropColumn('inventory_period_id');
        });
    }
};
