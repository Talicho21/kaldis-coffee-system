<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expense_budgets', function (Blueprint $table) {
            if (! Schema::hasColumn('expense_budgets', 'budget_amount')) {
                $table->decimal('budget_amount', 12, 2)->default(0)->after('department_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('expense_budgets', function (Blueprint $table) {
            if (Schema::hasColumn('expense_budgets', 'budget_amount')) {
                $table->dropColumn('budget_amount');
            }
        });
    }
};
