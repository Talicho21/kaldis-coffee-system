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
            $table->string('voucher_code')->nullable()->after('updated_by');
            $table->foreignId('registering_branch_id')->nullable()->after('collection_branch_id')->constrained('branches')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pre_orders', function (Blueprint $table) {
            $table->dropForeign(['registering_branch_id']);
            $table->dropColumn(['voucher_code', 'registering_branch_id']);
        });
    }
};
