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
        Schema::table('sales_budgets', function (Blueprint $table) {
            $table->foreignId('fiscal_month_id')->nullable()->after('fiscal_year_id')->constrained('fiscal_months')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_budgets', function (Blueprint $table) {
           $table->dropForeign(['fiscal_month_id']);
           $table->dropColumn('fiscal_month_id');
        });
    }
};
