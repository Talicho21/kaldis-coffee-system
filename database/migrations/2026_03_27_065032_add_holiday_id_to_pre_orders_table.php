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
        Schema::table('pre_orders', function (Blueprint $table) {
            $table->unsignedBigInteger('holiday_id')->nullable()->after('collection_day_id');
            $table->foreign('holiday_id')->references('id')->on('holidays')->onDelete('set null');
        });

        // Sync existing data from collection_days to pre_orders
        DB::statement("
            UPDATE pre_orders 
            JOIN collection_days ON pre_orders.collection_day_id = collection_days.id
            SET pre_orders.holiday_id = collection_days.holiday_id
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pre_orders', function (Blueprint $table) {
            $table->dropForeign(['holiday_id']);
            $table->dropColumn('holiday_id');
        });
    }

};
