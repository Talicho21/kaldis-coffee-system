<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_budget_logs', function (Blueprint $table) {
            // Make column nullable
            $table->unsignedBigInteger('sales_budget_id')
                  ->nullable()
                  ->change();
        });

        Schema::table('sales_budget_logs', function (Blueprint $table) {
            // Add foreign key with set null
            $table->foreign('sales_budget_id')
                  ->references('id')
                  ->on('sales_budgets')
                  ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('sales_budget_logs', function (Blueprint $table) {
            $table->dropForeign(['sales_budget_id']);
            $table->unsignedBigInteger('sales_budget_id')
                  ->nullable(false)
                  ->change();
            $table->foreign('sales_budget_id')
                  ->references('id')
                  ->on('sales_budgets')
                  ->onDelete('cascade');
        });
    }
};