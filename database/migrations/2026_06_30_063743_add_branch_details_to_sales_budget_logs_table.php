<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_budget_logs', function (Blueprint $table) {
            $table->string('branch_name')->nullable()->after('sales_budget_id');
            $table->unsignedTinyInteger('ethiopian_month')->nullable()->after('branch_name');
            $table->unsignedSmallInteger('ethiopian_year')->nullable()->after('ethiopian_month');
        });
    }

    public function down(): void
    {
        Schema::table('sales_budget_logs', function (Blueprint $table) {
            $table->dropColumn(['branch_name', 'ethiopian_month', 'ethiopian_year']);
        });
    }
};