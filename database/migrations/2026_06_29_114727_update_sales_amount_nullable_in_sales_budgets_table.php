<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_budgets', function (Blueprint $table) {
            // Only sales_amount can be null
            // prev_expense_budget stays NOT NULL
            $table->decimal('sales_amount', 15, 2)
                  ->nullable()
                  ->change();
        });
    }

    public function down(): void
    {
        Schema::table('sales_budgets', function (Blueprint $table) {
            $table->decimal('sales_amount', 15, 2)
                  ->nullable(false)
                  ->change();
        });
    }
};