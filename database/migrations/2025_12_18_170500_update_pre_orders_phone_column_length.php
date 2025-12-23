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
            // Add constraint for Ethiopian phone number format (+251 followed by 9XXXXXXXX)
            // Since MySQL doesn't support complex CHECK constraints for patterns, we'll use a simple one
            $table->string('phone_number', 13)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pre_orders', function (Blueprint $table) {
            $table->string('phone_number', 255)->change();
        });
    }
};
